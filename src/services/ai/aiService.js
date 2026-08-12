import { localAIProvider } from './localAIProvider.js'
import { cloudAIProvider } from './cloudAIProvider.js'
import { routeKeyConcepts } from './aiRouter.js'
import { SENTIMENT_MODEL_ID } from './constants.js'
import * as historyRepository from '../storage/historyRepository.js'

const PROMPT_PREVIEW_CHARS = 300

/**
 * Every AI operation gets one history entry, win or lose — this is the
 * single place that happens, so no caller has to remember to do it.
 * Recording failures are logged but never break the caller's result.
 */
async function recordHistory(entry) {
  try {
    await historyRepository.addHistoryEntry(entry)
  } catch (err) {
    console.error('Failed to record AI history entry:', err)
  }
}

function statusForError(err) {
  return err?.name === 'AbortError' ? 'cancelled' : 'error'
}

/**
 * Application-level entry point for AI operations. Components call
 * functions here — never a provider, router, or worker directly — so
 * providers stay swappable and routing/history logic stays in one place.
 */
export const aiService = {
  /**
   * Sentiment is a "simple task" in the hybrid architecture and always
   * runs locally — there's no cloud implementation to route to, by
   * design, not by omission.
   */
  async analyzeSentiment(text, { onProgress, documentId, documentTitle } = {}) {
    const startedAt = performance.now()
    const base = {
      documentId,
      documentTitle,
      operation: 'sentiment',
      provider: 'local',
      model: SENTIMENT_MODEL_ID,
      prompt: text.slice(0, PROMPT_PREVIEW_CHARS),
    }

    try {
      const result = await localAIProvider.analyzeSentiment(text, { onProgress })
      const durationMs = performance.now() - startedAt
      await recordHistory({
        ...base,
        response: `${result.label} (${Math.round(result.score * 100)}%)`,
        status: 'complete',
        durationMs,
        tokenUsage: null,
      })
      return { ...result, durationMs }
    } catch (err) {
      await recordHistory({
        ...base,
        response: null,
        status: statusForError(err),
        durationMs: performance.now() - startedAt,
        tokenUsage: null,
        error: err.message,
      })
      throw err
    }
  },

  /**
   * Summarization is a "complex task" — it always runs in the cloud.
   * Unlike key concepts, there's no local implementation worth routing to:
   * a deterministic local summarizer would just be truncation.
   */
  async summarize(text, { onChunk, signal, documentId, documentTitle } = {}) {
    const startedAt = performance.now()
    const base = {
      documentId,
      documentTitle,
      operation: 'summary',
      provider: 'cloud',
      prompt: text.slice(0, PROMPT_PREVIEW_CHARS),
    }

    try {
      const result = await cloudAIProvider.summarize(text, { onChunk, signal })
      const durationMs = performance.now() - startedAt
      await recordHistory({
        ...base,
        model: result.model,
        response: result.text,
        status: 'complete',
        durationMs,
        tokenUsage: result.usage,
      })
      return { ...result, durationMs }
    } catch (err) {
      const status = statusForError(err)
      await recordHistory({
        ...base,
        model: null,
        response: null,
        status,
        durationMs: performance.now() - startedAt,
        tokenUsage: null,
        error: status === 'error' ? err.message : null,
      })
      throw err
    }
  },

  /**
   * The one operation both providers can actually do, so this is where
   * the router (see aiRouter.js) makes a real decision instead of there
   * being only one capable provider. Returns a normalized shape
   * regardless of which provider ran: { concepts, provider, reason,
   * model, usage, durationMs }.
   */
  async extractKeyConcepts(text, { preference = 'auto', isOnline = true, onProgress, signal, documentId, documentTitle } = {}) {
    const { provider, reason } = routeKeyConcepts(text, preference, isOnline)
    const startedAt = performance.now()
    const base = {
      documentId,
      documentTitle,
      operation: 'key-concepts',
      provider,
      prompt: text.slice(0, PROMPT_PREVIEW_CHARS),
    }

    try {
      let outcome
      if (provider === 'local') {
        const keywords = await localAIProvider.extractKeyConcepts(text)
        outcome = { concepts: keywords.map((k) => k.term), provider, reason, model: null, usage: null }
      } else {
        const result = await cloudAIProvider.extractKeyConcepts(text, { onChunk: onProgress, signal })
        outcome = { concepts: result.concepts, provider, reason, model: result.model, usage: result.usage }
      }

      const durationMs = performance.now() - startedAt
      await recordHistory({
        ...base,
        model: outcome.model,
        response: outcome.concepts.join(', '),
        status: 'complete',
        durationMs,
        tokenUsage: outcome.usage,
      })
      return { ...outcome, durationMs }
    } catch (err) {
      const status = statusForError(err)
      await recordHistory({
        ...base,
        model: null,
        response: null,
        status,
        durationMs: performance.now() - startedAt,
        tokenUsage: null,
        error: status === 'error' ? err.message : null,
      })
      throw err
    }
  },
}

export const providers = {
  local: localAIProvider,
  cloud: cloudAIProvider,
}
