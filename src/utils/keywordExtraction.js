/**
 * Deterministic, frequency-based keyword extraction — not AI, just
 * counting. This is the "Local" side of the Key Concepts hybrid
 * operation: fast, free, private, and good enough for short documents.
 */

const STOPWORDS = new Set(
  (
    'a about above after again against all am an and any are aren as at be because been before being ' +
    'below between both but by can cannot could did do does doing down during each few for from further ' +
    'had has have having he her here hers herself him himself his how i if in into is it its itself just ' +
    'me more most my myself no nor not now of off on once only or other our ours ourselves out over own ' +
    'same she should so some such than that the their theirs them themselves then there these they this ' +
    'those through to too under until up very was we were what when where which while who whom why will ' +
    'with would you your yours yourself yourselves also into per within without been being does did doing ' +
    'been being able one two three'
  ).split(' '),
)

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function extractKeywords(text, { limit = 7 } = {}) {
  const words = text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []
  const counts = new Map()

  for (const word of words) {
    if (STOPWORDS.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ term: capitalize(word), count }))
}
