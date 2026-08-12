import { downloadTextFile } from '../../utils/fileUtils.js'
import * as documentRepository from '../storage/documentRepository.js'
import * as notesRepository from '../storage/notesRepository.js'
import * as historyRepository from '../storage/historyRepository.js'
import * as settingsRepository from '../storage/settingsRepository.js'

export const SESSION_FORMAT = 'ai-research-notebook-session'
export const SESSION_VERSION = 1

/** Bundles every document, note, AI history entry, and setting into one downloadable file. */
export async function exportSession() {
  const [documents, notes, history, settings] = await Promise.all([
    documentRepository.listDocuments(),
    notesRepository.listNotes(),
    historyRepository.listHistory(),
    settingsRepository.getAllSettings(),
  ])

  const session = {
    format: SESSION_FORMAT,
    version: SESSION_VERSION,
    exportedAt: new Date().toISOString(),
    documents,
    notes,
    history,
    settings,
  }

  downloadTextFile('research-session.json', JSON.stringify(session, null, 2), 'application/json')

  return {
    documentCount: documents.length,
    noteCount: notes.length,
    historyCount: history.length,
  }
}
