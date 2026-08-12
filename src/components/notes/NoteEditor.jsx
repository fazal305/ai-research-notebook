import { useState } from 'react'
import { SaveIndicator } from '../common/SaveIndicator.jsx'
import { Button } from '../common/Button.jsx'
import { useAutosaveField } from '../../hooks/useAutosaveField.js'
import { exportNote } from '../../services/notes/notesExporter.js'
import './NoteEditor.css'

/** Remounted via `key={note.id}` by the caller when the selected note changes. */
export function NoteEditor({ note, updateNote }) {
  const [title, setTitle] = useAutosaveField(note.title, (value) => updateNote(note.id, { title: value }), 800)
  const [content, setContent, saveState] = useAutosaveField(
    note.content,
    (value) => updateNote(note.id, { content: value }),
    600,
  )
  const [copyState, setCopyState] = useState('idle') // 'idle' | 'copied' | 'error'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
    setTimeout(() => setCopyState('idle'), 1500)
  }

  return (
    <div className="note-editor">
      <div className="note-editor__title-row">
        <input
          className="note-editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Note title"
        />
        <SaveIndicator state={saveState} />
      </div>

      <textarea
        className="note-editor__content scrollable"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your notes…"
        aria-label="Note content"
      />

      <div className="note-editor__actions">
        <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
          {copyState === 'copied' ? 'Copied' : copyState === 'error' ? "Couldn't copy" : 'Copy'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exportNote({ title, content }, 'md')}>
          Export .md
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => exportNote({ title, content }, 'txt')}>
          Export .txt
        </Button>
      </div>
    </div>
  )
}
