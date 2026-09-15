// Facilitador CPOR — server for the Azure App Service deployment.
//
// Serves the static front-end (index.html) and the /api routes that back
// its db/assets integration points (Cosmos DB + Blob Storage), replacing
// the window.claude.use(...) calls available in the Claude Artifacts
// runtime. Kept as a single small Express app so App Service can run it
// directly with `node server.js` — no build step.

const express = require('express');
const path = require('path');
const { randomUUID } = require('node:crypto');
const { getDocumentsContainer, getSettingsContainer, getAssetsContainerClient } = require('./server/lib/clients');

const app = express();
const PORT = process.env.PORT || 8080;
const SETTINGS_ID = 'settings';

app.use(express.json({ limit: '2mb' }));

// ————————————————————————————————————————————————————————————
// Documents — CPOR e-mails, Engagement POEs, checklists, Tenant ID
// reports. One JSON document each, in the `documents` container.
// ————————————————————————————————————————————————————————————
app.get('/api/documents', async (req, res) => {
  try {
    const container = await getDocumentsContainer();
    const { resources } = await container.items
      .query({ query: 'SELECT * FROM c ORDER BY c.updatedAt DESC OFFSET 0 LIMIT 50' })
      .fetchAll();
    res.json({ docs: resources });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const container = await getDocumentsContainer();
    const { resource } = await container.item(req.params.id, req.params.id).read();
    if (!resource) return res.status(404).json({ exists: false });
    res.json({ exists: true, data: resource });
  } catch (e) {
    if (e.code === 404) return res.status(404).json({ exists: false });
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const container = await getDocumentsContainer();
    await container.items.upsert({ ...req.body, id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const container = await getDocumentsContainer();
    await container.item(req.params.id, req.params.id).delete().catch((e) => {
      if (e.code !== 404) throw e;
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ————————————————————————————————————————————————————————————
// Settings — one shared document with the whole team's preferences.
// ————————————————————————————————————————————————————————————
app.get('/api/settings', async (req, res) => {
  try {
    const container = await getSettingsContainer();
    const { resource } = await container.item(SETTINGS_ID, SETTINGS_ID).read();
    if (!resource) return res.json({ exists: false });
    res.json({ exists: true, data: resource });
  } catch (e) {
    if (e.code === 404) return res.json({ exists: false });
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const container = await getSettingsContainer();
    await container.items.upsert({ ...req.body, id: SETTINGS_ID });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ————————————————————————————————————————————————————————————
// Assets — screenshots, stored as private blobs and streamed back
// through this API (never exposed directly, no SAS tokens to manage).
// ————————————————————————————————————————————————————————————
function extFromName(name) {
  const m = /\.[a-zA-Z0-9]+$/.exec(name || '');
  return m ? m[0] : '';
}

app.post('/api/assets', express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
  try {
    const container = await getAssetsContainerClient();
    const rawName = req.headers['x-file-name'] || 'upload';
    const fileName = decodeURIComponent(rawName);
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const id = randomUUID() + extFromName(fileName);
    const blockBlob = container.getBlockBlobClient(id);
    await blockBlob.uploadData(req.body, { blobHTTPHeaders: { blobContentType: contentType } });
    res.json({ id, url: '/api/assets/' + id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const container = await getAssetsContainerClient();
    const blockBlob = container.getBlockBlobClient(req.params.id);
    if (!(await blockBlob.exists())) return res.sendStatus(404);
    const props = await blockBlob.getProperties();
    res.set('Content-Type', props.contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    const download = await blockBlob.downloadToBuffer();
    res.send(download);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    const container = await getAssetsContainerClient();
    await container.getBlockBlobClient(req.params.id).deleteIfExists();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ————————————————————————————————————————————————————————————
// Front-end — the single-page app itself.
// ————————————————————————————————————————————————————————————
app.use(express.static(__dirname, { index: 'index.html' }));

app.listen(PORT, () => {
  console.log(`Facilitador CPOR ouvindo na porta ${PORT}`);
});
