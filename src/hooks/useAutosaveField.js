import { useEffect, useRef, useState } from 'react'
import { useDebounce } from './useDebounce.js'
import { onFlushRequest } from '../utils/saveBus.js'

/**
 * Local editable state for one field (a document's content, a note's
 * body, …) that autosaves itself after `delayMs` of inactivity, and can
 * also be force-saved immediately via the global Ctrl+S shortcut (see
 * utils/saveBus.js) without waiting out the debounce.
 *
 * `initialValue` is expected to be stable for the lifetime of the
 * component instance (callers remount via `key` when switching to a
 * different record, rather than passing a changing initialValue into an
 * already-mounted instance) — that's what lets this hook tell "the user
 * typed something new" apart from "the record underneath changed".
 */
export function useAutosaveField(initialValue, onSave, delayMs = 600) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const debounced = useDebounce(value, delayMs)

  const lastSubmittedRef = useRef(initialValue)
  const valueRef = useRef(value)
  const isMountedRef = useRef(true)
  valueRef.current = value

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  function submit(next) {
    if (next === lastSubmittedRef.current) return
    lastSubmittedRef.current = next
    setStatus('saving')
    Promise.resolve(onSave(next))
      .then(() => {
        if (isMountedRef.current) setStatus('saved')
      })
      .catch(() => {
        if (isMountedRef.current) setStatus('error')
      })
  }

  useEffect(() => {
    submit(debounced)
    // Only the debounced value should retrigger this — see submit()'s own
    // dedupe against lastSubmittedRef for why `onSave` isn't a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Ctrl+S: flush whatever's currently typed, bypassing the debounce.
  useEffect(() => onFlushRequest(() => submit(valueRef.current)), [])

  return [value, setValue, status]
}
