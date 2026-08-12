import { useCallback, useEffect, useState } from 'react'
import * as notesRepository from '../services/storage/notesRepository.js'

/** Notes scoped to a single document — mirrors useDocuments' shape. */
export function useNotes(documentId) {
  const [notes, setNotes] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!documentId) {
      setNotes([])
      setStatus('ready')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const list = await notesRepository.listNotesByDocument(documentId)
      setNotes(list)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [documentId])

  useEffect(() => {
    reload()
  }, [reload])

  const createNote = useCallback(
    async (input) => {
      const note = await notesRepository.createNote({ ...input, documentId })
      setNotes((prev) => [note, ...prev])
      return note
    },
    [documentId],
  )

  const updateNote = useCallback(async (id, patch) => {
    const updated = await notesRepository.updateNote(id, patch)
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? updated : n)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    )
    return updated
  }, [])

  const deleteNote = useCallback(async (id) => {
    await notesRepository.deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notes, status, error, reload, createNote, updateNote, deleteNote }
}
