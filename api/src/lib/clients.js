// Shared Cosmos DB / Blob Storage clients for the Facilitador CPOR API.
// Connection info comes from Static Web App application settings (never
// committed to the repo) — see /api/README.md for the expected names.

const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

const DATABASE_ID = 'facilitador';
const DOCUMENTS_CONTAINER_ID = 'documents';
const SETTINGS_CONTAINER_ID = 'settings';
const ASSETS_CONTAINER_NAME = 'assets';

let cosmosClient = null;
let containersReady = null;

function getCosmosClient() {
  if (!cosmosClient) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    if (!endpoint || !key) {
      throw new Error('COSMOS_ENDPOINT/COSMOS_KEY não configurados nas application settings.');
    }
    cosmosClient = new CosmosClient({ endpoint, key });
  }
  return cosmosClient;
}

// Creates the database/containers on first use so a fresh Cosmos account
// works without any manual portal setup beyond the account itself.
async function ensureContainers() {
  if (!containersReady) {
    containersReady = (async () => {
      const client = getCosmosClient();
      const { database } = await client.databases.createIfNotExists({ id: DATABASE_ID });
      const { container: documents } = await database.containers.createIfNotExists({
        id: DOCUMENTS_CONTAINER_ID,
        partitionKey: { paths: ['/id'] }
      });
      const { container: settings } = await database.containers.createIfNotExists({
        id: SETTINGS_CONTAINER_ID,
        partitionKey: { paths: ['/id'] }
      });
      return { documents, settings };
    })();
  }
  return containersReady;
}

async function getDocumentsContainer() {
  return (await ensureContainers()).documents;
}

async function getSettingsContainer() {
  return (await ensureContainers()).settings;
}

let blobContainerClientPromise = null;
async function getAssetsContainerClient() {
  if (!blobContainerClientPromise) {
    blobContainerClientPromise = (async () => {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurada nas application settings.');
      }
      const blobService = BlobServiceClient.fromConnectionString(connectionString);
      const container = blobService.getContainerClient(ASSETS_CONTAINER_NAME);
      await container.createIfNotExists();
      return container;
    })();
  }
  return blobContainerClientPromise;
}

module.exports = { getDocumentsContainer, getSettingsContainer, getAssetsContainerClient };
