import { useRef } from 'react'
import { Button } from '../common/Button.jsx'
import { getSupportedExtensions, parseImportedFile } from '../../services/documents/documentParser.js'

/**
 * Hidden file input behind a styled button. Imports are validated file by
 * file via documentParser — an unsupported or malformed file is reported
 * through onError without blocking the other files in the same selection.
 */
export function ImportButton({ onImport, onError }) {
  const inputRef = useRef(null)

  async function handleChange(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // allow re-selecting the same file later

    for (const file of files) {
      try {
        const parsed = await parseImportedFile(file)
        await onImport(parsed)
      } catch (err) {
        onError(`${file.name}: ${err.message}`)
      }
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
        Import
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={getSupportedExtensions().join(',')}
        multiple
        onChange={handleChange}
        className="visually-hidden"
        aria-label="Import documents"
        tabIndex={-1}
      />
    </>
  )
}
