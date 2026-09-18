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
const { chatCompletion } = require('./server/lib/openai');

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
// Tenant ID auto-lookup — replaces the manual tenantidfinder.com /
// whatismytenantid.com workflow on the Tenant ID tab: given a batch of
// bare domains, resolve each one's Microsoft 365 Tenant ID (via Azure AD's
// public OIDC discovery endpoint) plus MX, DMARC and Autodiscover straight
// from DNS. No auth, no external API key, no new dependency — Node's
// global fetch + the built-in node:dns promises API cover all of it.
// ————————————————————————————————————————————————————————————
const dns = require('node:dns').promises;

function normalizeLookupDomain(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

async function lookupTenantId(domain) {
  try {
    const res = await fetch(`https://login.microsoftonline.com/${domain}/v2.0/.well-known/openid-configuration`);
    if (!res.ok) return ''; // e.g. AADSTS90002 — domain isn't a verified Azure AD domain
    const body = await res.json();
    const m = /\/([0-9a-f-]{36})\//i.exec(body.issuer || '');
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}

async function lookupMx(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => `${r.priority} ${r.exchange}`);
  } catch (e) {
    return [];
  }
}

async function lookupDmarc(domain) {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const joined = records
      .map((chunks) => chunks.join(''))
      .filter((txt) => /DMARC1/i.test(txt))
      .join(' ');
    return joined;
  } catch (e) {
    return '';
  }
}

async function lookupAutodiscover(domain) {
  try {
    const records = await dns.resolveCname(`autodiscover.${domain}`);
    return (records && records[0]) || 'None';
  } catch (e) {
    return 'None';
  }
}

async function lookupTenantDomain(rawDomain) {
  const domain = normalizeLookupDomain(rawDomain);
  const result = { domain, tenantId: '', mxLines: [], dmarcRaw: '', autodiscover: 'None' };
  if (!domain) return result;
  try {
    const [tenantId, mxLines, dmarcRaw, autodiscover] = await Promise.all([
      lookupTenantId(domain),
      lookupMx(domain),
      lookupDmarc(domain),
      lookupAutodiscover(domain)
    ]);
    result.tenantId = tenantId;
    result.mxLines = mxLines;
    result.dmarcRaw = dmarcRaw;
    result.autodiscover = autodiscover;
  } catch (e) {
    // Each sub-lookup already swallows its own errors — this is just a
    // last-resort net so one domain can never take the whole batch down.
  }
  return result;
}

app.post('/api/tenant-lookup', async (req, res) => {
  const domains = Array.isArray(req.body && req.body.domains) ? req.body.domains : [];
  const results = [];
  const CONCURRENCY = 8;
  try {
    for (let i = 0; i < domains.length; i += CONCURRENCY) {
      const batch = domains.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map((d) => lookupTenantDomain(d)));
      settled.forEach((outcome, idx) => {
        if (outcome.status === 'fulfilled') {
          results.push(outcome.value);
        } else {
          results.push({ domain: normalizeLookupDomain(batch[idx]), tenantId: '', mxLines: [], dmarcRaw: '', autodiscover: 'None' });
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
  res.json({ results });
});

// ————————————————————————————————————————————————————————————
// AI — Azure OpenAI-backed image classification (replaces the `sample`
// capability only available in the Claude Artifacts runtime) plus a
// generic text-completion endpoint for future reuse.
// ————————————————————————————————————————————————————————————
function stripCodeFence(text) {
  const trimmed = String(text || '').trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced ? fenced[1].trim() : trimmed;
}

app.post('/api/classify', async (req, res) => {
  try {
    const { prompt, images } = req.body || {};
    if (!prompt || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Corpo inválido: esperado { prompt, images: [dataUrl, ...] }.' });
    }
    const content = [
      { type: 'text', text: prompt },
      ...images.map((url) => ({ type: 'image_url', image_url: { url, detail: 'low' } }))
    ];
    const raw = await chatCompletion([{ role: 'user', content }], { maxTokens: 500, temperature: 0 });
    let parsed;
    try {
      parsed = JSON.parse(stripCodeFence(raw));
    } catch (e) {
      return res.status(502).json({ error: 'Resposta da IA não pôde ser interpretada como JSON.' });
    }
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai-text', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Corpo inválido: esperado { prompt }.' });
    }
    const text = await chatCompletion([{ role: 'user', content: prompt }], { maxTokens: 800, temperature: 0 });
    res.json({ text });
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
