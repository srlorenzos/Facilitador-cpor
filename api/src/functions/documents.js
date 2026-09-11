// Backs the app's `db.collection('documents')` / `db.doc('documents/{id}')`
// calls — CPOR e-mails, Engagement POEs, checklists and Tenant ID reports
// all live here as one JSON document each.

const { app } = require('@azure/functions');
const { getDocumentsContainer } = require('../lib/clients');

app.http('documentsList', {
  methods: ['GET'],
  route: 'documents',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getDocumentsContainer();
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c ORDER BY c.updatedAt DESC OFFSET 0 LIMIT 50'
        })
        .fetchAll();
      return { jsonBody: { docs: resources } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('documentsGet', {
  methods: ['GET'],
  route: 'documents/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getDocumentsContainer();
      const id = request.params.id;
      const { resource } = await container.item(id, id).read();
      if (!resource) return { status: 404, jsonBody: { exists: false } };
      return { jsonBody: { exists: true, data: resource } };
    } catch (e) {
      if (e.code === 404) return { status: 404, jsonBody: { exists: false } };
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('documentsSet', {
  methods: ['PUT'],
  route: 'documents/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getDocumentsContainer();
      const id = request.params.id;
      const body = await request.json();
      const item = { ...body, id };
      await container.items.upsert(item);
      return { jsonBody: { ok: true } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('documentsDelete', {
  methods: ['DELETE'],
  route: 'documents/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getDocumentsContainer();
      const id = request.params.id;
      await container.item(id, id).delete().catch((e) => {
        if (e.code !== 404) throw e;
      });
      return { jsonBody: { ok: true } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});
