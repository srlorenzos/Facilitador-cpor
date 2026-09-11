// Backs the app's `db.doc('app/settings')` — one shared document with the
// whole team's preferences/defaults (theme, densidade, equipe, etc.).

const { app } = require('@azure/functions');
const { getSettingsContainer } = require('../lib/clients');

const SETTINGS_ID = 'settings';

app.http('settingsGet', {
  methods: ['GET'],
  route: 'settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getSettingsContainer();
      const { resource } = await container.item(SETTINGS_ID, SETTINGS_ID).read();
      if (!resource) return { jsonBody: { exists: false } };
      return { jsonBody: { exists: true, data: resource } };
    } catch (e) {
      if (e.code === 404) return { jsonBody: { exists: false } };
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});

app.http('settingsSet', {
  methods: ['PUT'],
  route: 'settings',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = await getSettingsContainer();
      const body = await request.json();
      const item = { ...body, id: SETTINGS_ID };
      await container.items.upsert(item);
      return { jsonBody: { ok: true } };
    } catch (e) {
      context.error(e);
      return { status: 500, jsonBody: { error: e.message } };
    }
  }
});
