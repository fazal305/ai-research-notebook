import { useEffect, useMemo, useState } from 'react'
import { SearchInput } from '../common/SearchInput.jsx'
import { Button } from '../common/Button.jsx'
import { EmptyState } from '../common/EmptyState.jsx'
import { Spinner } from '../common/Spinner.jsx'
import { NoteListItem } from './NoteListItem.jsx'
import { NoteEditor } from './NoteEditor.jsx'
import { useNotes } from '../../hooks/useNotes.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import './NotesPanel.css'

export function NotesPanel({ documentId }) {
  const { notes, status, error, createNote, updateNote, deleteNote } = useNotes(documentId)
  const [query, setQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const debouncedQuery = useDebounce(query, 200)

  // Notes are scoped per document, so switching documents should drop
  // any note selection that belonged to the previous one.
  useEffect(() => {
    setSelectedNoteId(null)
    setQuery('')
  }, [documentId])

  const filteredNotes = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
  }, [notes, debouncedQuery])

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null

  async function handleNewNote() {
    const note = await createNote({ title: `Note ${notes.length + 1}`, content: '' })
    setSelectedNoteId(note.id)
  }

  async function handleDelete(id) {
    await deleteNote(id)
    setSelectedNoteId((current) => (current === id ? null : current))
  }

  return (
    <div className="notes-panel">
      <div className="notes-panel__toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search notes…" />
        <Button type="button" variant="ghost" size="sm" onClick={handleNewNote}>
          New note
        </Button>
      </div>

      <div className="notes-panel__list scrollable">
        {status === 'loading' ? (
          <Spinner label="Loading notes…" />
        ) : status === 'error' ? (
          <EmptyState title="Couldn't load notes" description={error?.message} />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            title={debouncedQuery ? 'No matches' : 'No notes yet'}
            description={debouncedQuery ? 'No notes match your search.' : 'Add a note to start capturing research.'}
          />
        ) : (
          <ul>
            {filteredNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                onSelect={setSelectedNoteId}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="notes-panel__editor">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} updateNote={updateNote} />
        ) : (
          <EmptyState title="No note selected" description="Choose a note above, or create a new one." />
        )}
      </div>
    </div>
  )
}
