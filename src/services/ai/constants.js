// Shared between aiWorker.js (which runs the model) and aiService.js
// (which records it in history) so the id only lives in one place.
export const SENTIMENT_MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'

// Shared between the History panel and the Dashboard so operation names
// render identically wherever they show up.
export const OPERATION_LABELS = {
  sentiment: 'Sentiment',
  summary: 'Summary',
  'key-concepts': 'Key Concepts',
}
