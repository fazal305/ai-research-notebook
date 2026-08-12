/**
 * Tiny pub/sub so a global "Ctrl+S" shortcut can ask every mounted
 * useAutosaveField instance to flush its pending debounced save
 * immediately, without editors and the keyboard-shortcut handler needing
 * to know about each other directly.
 */
const listeners = new Set()

export function requestFlush() {
  for (const listener of listeners) listener()
}

export function onFlushRequest(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
