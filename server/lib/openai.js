// Azure OpenAI chat-completions helper for the Facilitador CPOR server.
// Connection info comes from App Service application settings (never
// committed to the repo) — see /server/README.md for the expected names.

const API_VERSION = '2024-08-01-preview';

// Calls the Azure OpenAI chat completions REST API and returns the first
// choice's raw text content. `messages` follows the standard OpenAI chat
// message shape (content can be a string or a content-parts array, e.g.
// for vision requests with image_url parts).
async function chatCompletion(messages, { maxTokens = 800, temperature = 0 } = {}) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!endpoint || !key || !deployment) {
    throw new Error('AZURE_OPENAI_ENDPOINT/AZURE_OPENAI_KEY/AZURE_OPENAI_DEPLOYMENT não configurados nas application settings.');
  }

  const base = endpoint.endsWith('/') ? endpoint : endpoint + '/';
  const url = `${base}openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${API_VERSION}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Azure OpenAI request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const body = await res.json();
  const content = body && body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Azure OpenAI response sem conteúdo de texto.');
  }
  return content;
}

module.exports = { chatCompletion };
