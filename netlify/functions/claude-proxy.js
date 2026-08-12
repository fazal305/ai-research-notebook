/**
 * Server-side proxy for the Anthropic Claude API. This is the ONLY place
 * ANTHROPIC_API_KEY is ever read — it lives in Netlify's server-side
 * environment variables, never in frontend code or a response body. The
 * browser calls this function; this function calls Anthropic and streams
 * the response straight back.
 *
 * Why a proxy is required at all: calling Anthropic's API directly from
 * the browser would mean embedding the API key in frontend JS, where
 * anyone can read it out of network requests or the bundle. There is no
 * way to "hide" a secret in client-side code — a backend that holds the
 * key server-side is the only safe option.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MAX_INPUT_CHARS = 20000
const MAX_OUTPUT_TOKENS = 1024

// Whitelisted operations only — the client sends an operation name, never
// a raw system prompt, so a compromised/malicious frontend request can't
// smuggle arbitrary instructions to the model.
const SYSTEM_PROMPTS = {
  summarize:
    'You are a research assistant. Summarize the given text concisely and accurately in 2-4 sentences. ' +
    'Do not add information that is not present in the text. Do not include any preamble like "Here is a summary" — respond with just the summary itself.',
  'key-concepts':
    'You are a research assistant. Extract the 5-8 most important concepts, topics, or terms from the given ' +
    'text. Respond with ONLY the concepts, one per line, no numbering, no bullets, no explanation.',
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(503, {
      error: 'Cloud AI is not configured on the server (ANTHROPIC_API_KEY is not set).',
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' })
  }

  const { text, operation } = body ?? {}
  const systemPrompt = SYSTEM_PROMPTS[operation]
  if (!systemPrompt) {
    return jsonResponse(400, { error: `Unknown or missing operation: "${operation}".` })
  }
  if (typeof text !== 'string' || !text.trim()) {
    return jsonResponse(400, { error: 'No text provided.' })
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

  let anthropicResponse
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        stream: true,
        messages: [{ role: 'user', content: text.slice(0, MAX_INPUT_CHARS) }],
      }),
    })
  } catch {
    return jsonResponse(502, { error: 'Could not reach the Anthropic API.' })
  }

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    let detail = ''
    try {
      detail = (await anthropicResponse.text()).slice(0, 500)
    } catch {
      // ignore
    }
    return jsonResponse(anthropicResponse.status, {
      error: `Anthropic API error (${anthropicResponse.status}). ${detail}`,
    })
  }

  // Stream Anthropic's SSE response straight through to the browser.
  return new Response(anthropicResponse.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    },
  })
}

export const config = {
  path: '/api/claude-proxy',
}
