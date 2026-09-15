# Server — Facilitador CPOR

`server.js` (na raiz do repositório) é um servidor Express que serve o front-end
(`index.html`) e a API que dá ao app um `db` (Cosmos DB) e um `assets` (Blob
Storage) reais, no lugar dos `window.claude.use(...)` originais (específicos
do runtime de Artifacts da Claude). Publicado no Azure App Service.

## Rotas

- `GET/PUT /api/settings` — documento único de configurações da equipe.
- `GET /api/documents` — lista os últimos 50 documentos (CPOR, POE, checklist, tenant).
- `GET/PUT/DELETE /api/documents/{id}` — um documento.
- `POST /api/assets` — upload de um arquivo (binário no corpo, `x-file-name` no header).
- `GET/DELETE /api/assets/{id}` — download/remoção de um arquivo.

## Application settings necessárias (App Service → Configuration)

- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`

Nunca commitar esses valores — são configurados como secrets no App Service
(`az webapp config appsettings set`), nunca em código.

## Rodando localmente

```
npm install
COSMOS_ENDPOINT=... COSMOS_KEY=... AZURE_STORAGE_CONNECTION_STRING=... npm start
```
