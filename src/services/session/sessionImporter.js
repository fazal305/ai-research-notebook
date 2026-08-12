import { validateSessionData } from '../../utils/validation.js'
import * as documentRepository from '../storage/documentRepository.js'
import * as notesRepository from '../storage/notesRepository.js'
import * as historyRepository from '../storage/historyRepository.js'

/** Reads and validates a session file without writing anything yet. */
export async function parseSessionFile(file) {
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  return validateSessionData(data)
}

/**
 * Writes a validated session into IndexedDB. Every record gets a fresh id
 * (createDocument/createNote/addHistoryEntry all generate their own) so an
 * import can never collide with existing data — importing the same file
 * twice just adds a second copy rather than erroring or overwriting.
 * documentId references in notes/history are remapped from the file's old
 * ids to the newly-created ones.
 */
export async function importSession({ documents, notes, history }) {
  const idMap = new Map()

  for (const doc of documents) {
    const created = await documentRepository.createDocument({ title: doc.title, type: doc.type, content: doc.content })
    if (doc.originalId) idMap.set(doc.originalId, created.id)
  }

  for (const note of notes) {
    const newDocumentId = note.originalDocumentId ? (idMap.get(note.originalDocumentId) ?? null) : null
    await notesRepository.createNote({ documentId: newDocumentId, title: note.title, content: note.content })
  }

  for (const entry of history) {
    const newDocumentId = entry.originalDocumentId ? (idMap.get(entry.originalDocumentId) ?? null) : null
    await historyRepository.addHistoryEntry({
      documentId: newDocumentId,
      documentTitle: entry.documentTitle,
      operation: entry.operation,
      provider: entry.provider,
      model: entry.model,
      prompt: entry.prompt,
      response: entry.response,
      status: entry.status,
      durationMs: entry.durationMs,
      tokenUsage: entry.tokenUsage,
      error: entry.error,
    })
  }

  return { documentCount: documents.length, noteCount: notes.length, historyCount: history.length }
}
