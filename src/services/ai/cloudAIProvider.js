/**
 * Cloud AI provider: talks to the Anthropic Claude API through the
 * server-side proxy at netlify/functions/claude-proxy.js. The frontend
 * never holds an API key — the proxy holds it, and this module never sees
 * or transmits it either.
 */

const PROXY_ENDPOINT = "/api/claude-proxy";

export class CloudUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "CloudUnavailableError";
  }
}

/** Parses one SSE "data: {...}" block into its JSON payload, or null if not a data line. */
function parseEventPayload(rawEvent) {
  const dataLine = rawEvent
    .split("\n")
    .find((line) => line.startsWith("data:"));
  if (!dataLine) return null;
  const json = dataLine.slice(5).trim();
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function streamAnthropicResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let model = null;
  let usage = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? ""; // last piece may be an incomplete event

    for (const rawEvent of events) {
      const payload = parseEventPayload(rawEvent);
      if (!payload) continue;

      if (payload.type === "message_start") {
        model = payload.message?.model ?? null;
        usage = payload.message?.usage ?? null;
      } else if (
        payload.type === "content_block_delta" &&
        payload.delta?.type === "text_delta"
      ) {
        fullText += payload.delta.text;
        onChunk?.(fullText);
      } else if (payload.type === "message_delta" && payload.usage) {
        usage = { ...usage, ...payload.usage };
      } else if (payload.type === "error") {
        throw new CloudUnavailableError(
          payload.error?.message ?? "Cloud AI returned an error.",
        );
      }
    }
  }

  return { text: fullText, model, usage };
}

async function callProxy(operation, text, signal) {
  let response;
  try {
    response = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, operation }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new CloudUnavailableError(
      "Couldn't reach the cloud AI service. Check your network connection.",
    );
  }

  if (response.status === 404) {
    throw new CloudUnavailableError(
      "The cloud AI proxy is not running. Start the dev server with `npm run dev:cloud` instead of `npm run dev` to enable cloud features locally.",
    );
  }

  if (!response.ok) {
    let message = `Cloud AI request failed (${response.status}).`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) message = errorBody.error;
    } catch {
      // response wasn't JSON; keep the generic message
    }
    throw new CloudUnavailableError(message);
  }

  if (!response.body) {
    throw new CloudUnavailableError(
      "The server did not return a streaming response.",
    );
  }

  return response;
}

export const cloudAIProvider = {
  id: "cloud",
  label: "Cloud (Claude)",

  /** Frontend-only connectivity signal — the proxy is the source of truth on whether the API key is set. */
  isReachable() {
    return typeof navigator === "undefined" || navigator.onLine;
  },

  async summarize(text, { onChunk, signal } = {}) {
    const response = await callProxy("summarize", text, signal);
    return streamAnthropicResponse(response, onChunk);
  },

  async extractKeyConcepts(text, { onChunk, signal } = {}) {
    const response = await callProxy("key-concepts", text, signal);
    const result = await streamAnthropicResponse(response, onChunk);
    const concepts = result.text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);
    return { ...result, concepts };
  },
};
