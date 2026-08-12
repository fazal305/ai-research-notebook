/**
 * Decides which provider handles an operation when the caller hasn't
 * forced one ("automatic" mode), and always returns a human-readable
 * reason — the router's decisions are meant to be visible to the user,
 * not a hidden implementation detail.
 *
 *                    User Text
 *                       │
 *                       ▼
 *              ┌─────────────────┐
 *              │ Analysis Router │
 *              └────────┬────────┘
 *                       │
 *              ┌────────┴────────┐
 *              │                 │
 *          Simple Task       Complex Task
 *              │                 │
 *              ▼                 ▼
 *        Local Browser AI      Cloud AI
 *
 * "Simple vs complex" for an operation that both providers can do is
 * approximated by document length: a short document's key concepts are
 * well captured by frequency counting, but longer/denser text benefits
 * from the cloud model's actual comprehension.
 */

const LOCAL_WORD_COUNT_THRESHOLD = 300

function countWords(text) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/**
 * @param {string} text
 * @param {'auto'|'local'|'cloud'} preference
 * @param {boolean} isOnline
 * @returns {{ provider: 'local'|'cloud', reason: string }}
 */
export function routeKeyConcepts(text, preference, isOnline) {
  if (preference === 'local') {
    return { provider: 'local', reason: 'Forced to Local by your settings.' }
  }

  if (preference === 'cloud') {
    if (!isOnline) {
      return { provider: 'local', reason: "Cloud was requested, but you're offline — falling back to Local." }
    }
    return { provider: 'cloud', reason: 'Forced to Cloud by your settings.' }
  }

  // 'auto'
  if (!isOnline) {
    return { provider: 'local', reason: "Automatic: you're offline, so Local is used." }
  }

  const wordCount = countWords(text)
  if (wordCount <= LOCAL_WORD_COUNT_THRESHOLD) {
    return {
      provider: 'local',
      reason: `Automatic: short document (${wordCount} words) — Local extraction is fast and sufficient.`,
    }
  }
  return {
    provider: 'cloud',
    reason: `Automatic: longer document (${wordCount} words) — Cloud AI gives more nuanced concepts.`,
  }
}
