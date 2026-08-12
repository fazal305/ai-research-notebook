/**
 * Local AI provider: runs everything entirely in the browser.
 *   - analyzeSentiment: Transformers.js + WASM, via aiWorker.js.
 *   - extractKeyConcepts: plain frequency counting (not a model), via
 *     textWorker.js — it's "local processing" in the hybrid architecture
 *     sense even though no model is involved.
 * Each worker is a module-level singleton rather than owned by a
 * component/hook — a downloaded model should stay loaded for the rest of
 * the session regardless of which panel is currently mounted.
 */

let sentimentWorker = null
let sentimentRequestCounter = 0
const sentimentPending = new Map()

function getSentimentWorker() {
  if (sentimentWorker) return sentimentWorker

  sentimentWorker = new Worker(new URL('../../workers/aiWorker.js', import.meta.url), { type: 'module' })

  sentimentWorker.onmessage = (event) => {
    const { id, type, progress, result, error } = event.data
    const entry = sentimentPending.get(id)
    if (!entry) return // no longer awaited (e.g. a stale response)

    if (type === 'model:progress') {
      entry.onProgress?.(progress)
      return
    }
    if (type === 'analyzeSentiment:success') {
      sentimentPending.delete(id)
      entry.resolve(result)
    } else if (type === 'analyzeSentiment:error') {
      sentimentPending.delete(id)
      entry.reject(new Error(error))
    }
  }

  sentimentWorker.onerror = () => {
    for (const entry of sentimentPending.values()) {
      entry.reject(new Error('The local AI worker crashed.'))
    }
    sentimentPending.clear()
    sentimentWorker = null // allow a fresh worker to be created on the next call
  }

  return sentimentWorker
}

let textWorker = null
let textRequestCounter = 0
const textPending = new Map()

function getTextWorker() {
  if (textWorker) return textWorker

  textWorker = new Worker(new URL('../../workers/textWorker.js', import.meta.url), { type: 'module' })

  textWorker.onmessage = (event) => {
    const { id, type, keywords, error } = event.data
    const entry = textPending.get(id)
    if (!entry) return

    if (type === 'extractKeywords:success') {
      textPending.delete(id)
      entry.resolve(keywords)
    } else if (type === 'extractKeywords:error') {
      textPending.delete(id)
      entry.reject(new Error(error))
    }
  }

  textWorker.onerror = () => {
    for (const entry of textPending.values()) {
      entry.reject(new Error('The text-processing worker crashed.'))
    }
    textPending.clear()
    textWorker = null
  }

  return textWorker
}

export const localAIProvider = {
  id: 'local',
  label: 'Local',

  async analyzeSentiment(text, { onProgress } = {}) {
    const activeWorker = getSentimentWorker()
    const id = ++sentimentRequestCounter
    return new Promise((resolve, reject) => {
      sentimentPending.set(id, { resolve, reject, onProgress })
      activeWorker.postMessage({ id, type: 'analyzeSentiment', payload: { text } })
    })
  },

  async extractKeyConcepts(text) {
    const activeWorker = getTextWorker()
    const id = ++textRequestCounter
    return new Promise((resolve, reject) => {
      textPending.set(id, { resolve, reject })
      activeWorker.postMessage({ id, type: 'extractKeywords', payload: { text, limit: 7 } })
    })
  },
}
