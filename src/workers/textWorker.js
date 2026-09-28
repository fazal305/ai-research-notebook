import { textStats } from "../utils/textUtils.js";
import { extractKeywords } from "../utils/keywordExtraction.js";

/**
 * Runs local, non-AI text processing off the main thread: statistics and
 * keyword extraction. Both are regex/counting based and scale with
 * document size — fine for a paragraph, but a large imported document
 * (megabytes of text) can take long enough to noticeably stall the UI
 * thread if run inline. Doing it here means the app stays interactive
 * (typing, scrolling, theme toggling) while a big document is processed.
 *
 * Message protocol: { id, type, payload } in,
 * { id, type: '<type>:success' | '<type>:error', ... } out. The id lets
 * the caller ignore stale responses from a superseded request.
 */
self.onmessage = (event) => {
  const { id, type, payload } = event.data ?? {};

  if (type === "computeStats") {
    try {
      const stats = textStats(payload.text);
      self.postMessage({ id, type: "computeStats:success", stats });
    } catch (err) {
      self.postMessage({ id, type: "computeStats:error", error: err.message });
    }
    return;
  }

  if (type === "extractKeywords") {
    try {
      const keywords = extractKeywords(payload.text, { limit: payload.limit });
      self.postMessage({ id, type: "extractKeywords:success", keywords });
    } catch (err) {
      self.postMessage({
        id,
        type: "extractKeywords:error",
        error: err.message,
      });
    }
  }
};
