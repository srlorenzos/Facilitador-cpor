# API — Facilitador CPOR

Backend serverless (Azure Functions, integrado ao Azure Static Web Apps) que dá ao
`index.html` um `db` (Cosmos DB) e um `assets` (Blob Storage) reais, no lugar dos
`window.claude.use(...)` originais (específicos do runtime de Artifacts da Claude).

## Rotas

- `GET/PUT /api/settings` — documento único de configurações da equipe.
- `GET /api/documents` — lista os últimos 50 documentos (CPOR, POE, checklist, tenant).
- `GET/PUT/DELETE /api/documents/{id}` — um documento.
- `POST /api/assets` — upload de um arquivo (binário no corpo, `x-file-name` no header).
- `GET/DELETE /api/assets/{id}` — download/remoção de um arquivo.

## Application settings necessárias (Static Web App → Configuration)

- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`

Nunca commitar esses valores — são configurados como secrets na Static Web App
(`az staticwebapp appsettings set`), não em `local.settings.json`.
