import { pipeline, env } from '@xenova/transformers'
import { SENTIMENT_MODEL_ID } from '../services/ai/constants.js'

/**
 * Loads and runs the local sentiment-analysis model entirely inside this
 * worker. Model loading involves downloading tens of megabytes and running
 * WASM inference — both slow enough that doing them on the main thread
 * would freeze the UI for seconds. The pipeline is cached on the worker
 * (module-level) so the model is only downloaded/initialized once per
 * page load, then reused for every subsequent analysis request.
 */

// Browser cache (Cache API), not a bundled local copy — first run
// downloads the model from the Hugging Face hub; the browser caches it,
// so reloads are instant afterward.
env.allowLocalModels = false

// The model was fine-tuned on short single-sentence inputs; also keeps
// inference fast and avoids exceeding the tokenizer's max sequence length.
const MAX_INPUT_CHARS = 2000

let pipelinePromise = null

function loadPipeline(onProgress) {
  if (!pipelinePromise) {
    pipelinePromise = pipeline('sentiment-analysis', SENTIMENT_MODEL_ID, {
      progress_callback: onProgress,
    })
  }
  return pipelinePromise
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data ?? {}

  if (type === 'analyzeSentiment') {
    try {
      const classifier = await loadPipeline((progress) => {
        self.postMessage({ id, type: 'model:progress', progress })
      })

      const text = String(payload.text ?? '').slice(0, MAX_INPUT_CHARS)
      if (!text.trim()) {
        throw new Error('There is no text to analyze.')
      }

      const [result] = await classifier(text)
      self.postMessage({
        id,
        type: 'analyzeSentiment:success',
        result: { label: result.label, score: result.score },
      })
    } catch (err) {
      self.postMessage({ id, type: 'analyzeSentiment:error', error: err.message ?? String(err) })
    }
  }
}
