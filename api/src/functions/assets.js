// Backs the app's `assets.upload(file)` / `assets.delete(id)`, plus the
// `fetch(item.url)` calls used to embed full-resolution screenshots when
// copying the finished e-mail. Files are stored as private blobs and
// streamed back through this API — never exposed directly, no SAS tokens
// to manage on the client.

const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');
const { getAssetsContainerClient } = require('../lib/clients');

function extFromName(name) {
  const m = /\.[a-zA-Z0-9]+$/.exec(name || '');
  return m ? m[0] : '';
}

app.http('assetsUpload', {
  methods: ['POST'],
  route: 'assets',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getAssetsContainerClient();
      const rawName = request.headers.get('x-file-name') || 'upload';
      const fileName = decodeURIComponent(rawName);
      const contentType = request.headers.get('content-type') || 'application/octet-stream';
      const id = randomUUID() + extFromName(fileName);
      const buffer = Buffer.from(await request.arrayBuffer());
      const blockBlob = container.getBlockBlobClient(id);
      await blockBlob.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType }
      });
      return { jsonBody: { id, url: '/api/assets/' + id } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('assetsGet', {
  methods: ['GET'],
  route: 'assets/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getAssetsContainerClient();
      const blockBlob = container.getBlockBlobClient(request.params.id);
      const exists = await blockBlob.exists();
      if (!exists) return { status: 404 };
      const download = await blockBlob.downloadToBuffer();
      const props = await blockBlob.getProperties();
      return {
        status: 200,
        headers: {
          'Content-Type': props.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: download
      };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('assetsDelete', {
  methods: ['DELETE'],
  route: 'assets/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getAssetsContainerClient();
      const blockBlob = container.getBlockBlobClient(request.params.id);
      await blockBlob.deleteIfExists();
      return { jsonBody: { ok: true } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});
