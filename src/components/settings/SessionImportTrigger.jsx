import { forwardRef, useImperativeHandle, useRef } from 'react'
import { parseSessionFile, importSession } from '../../services/session/sessionImporter.js'

/** Invisible file input for importing a research-session.json bundle, opened imperatively. */
export const SessionImportTrigger = forwardRef(function SessionImportTrigger({ onSuccess, onError }, ref) {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    open: () => inputRef.current?.click(),
  }))

  async function handleChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const validated = await parseSessionFile(file)
      if (validated.documents.length === 0 && validated.notes.length === 0 && validated.history.length === 0) {
        onError?.('Nothing importable was found in this file.', validated.warnings)
        return
      }
      const result = await importSession(validated)
      onSuccess?.(result, validated.warnings)
    } catch (err) {
      onError?.(err.message)
    }
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept=".json,application/json"
      onChange={handleChange}
      className="visually-hidden"
      aria-label="Import research session"
      tabIndex={-1}
    />
  )
})
