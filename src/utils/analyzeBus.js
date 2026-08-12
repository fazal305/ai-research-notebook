/**
 * Same pattern as saveBus.js: lets the global Ctrl+Enter shortcut ask
 * whichever SentimentPanel is currently mounted to run its analysis,
 * without the keyboard-shortcut handler needing a direct reference to it.
 */
const listeners = new Set()

export function requestAnalyze() {
  for (const listener of listeners) listener()
}

export function onAnalyzeRequest(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
