import { openDB } from 'idb'

/**
 * Single IndexedDB database for the whole app. All persistence — documents,
 * notes, AI history, settings — goes through this one connection rather
 * than scattering `indexedDB.open()` calls across the codebase.
 *
 * Object stores:
 *   documents  — research documents (id, title, type, content, size, timestamps)
 *   notes      — research notes, optionally linked to a document via documentId
 *   aiHistory  — every AI request/response, for the History panel
 *   settings   — small key/value store for app-level settings that don't
 *                need to be available before first paint (theme is the
 *                exception — it lives in localStorage, see SettingsContext)
 */

export const DB_NAME = 'ai-research-notebook'
export const DB_VERSION = 1

export class StorageError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

let dbPromise = null

function upgrade(db) {
  if (!db.objectStoreNames.contains('documents')) {
    const store = db.createObjectStore('documents', { keyPath: 'id' })
    store.createIndex('updatedAt', 'updatedAt')
    store.createIndex('title', 'title')
  }

  if (!db.objectStoreNames.contains('notes')) {
    const store = db.createObjectStore('notes', { keyPath: 'id' })
    store.createIndex('documentId', 'documentId')
    store.createIndex('updatedAt', 'updatedAt')
  }

  if (!db.objectStoreNames.contains('aiHistory')) {
    const store = db.createObjectStore('aiHistory', { keyPath: 'id' })
    store.createIndex('documentId', 'documentId')
    store.createIndex('timestamp', 'timestamp')
  }

  if (!db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'key' })
  }
}

/**
 * Returns the shared DB connection, opening it on first call. Callers
 * should not hold onto the resolved value across a long session — always
 * re-await getDB() so a `terminated` (e.g. the browser reclaiming a
 * background tab's connection) transparently reconnects on next use.
 */
export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade,
      blocked() {
        console.warn('IndexedDB upgrade blocked by another open tab of this app.')
      },
      blocking() {
        // Another tab wants to upgrade; release our connection so it can.
        dbPromise?.then((db) => db.close())
        dbPromise = null
      },
      terminated() {
        dbPromise = null
      },
    }).catch((cause) => {
      dbPromise = null
      throw new StorageError('Failed to open the local database.', cause)
    })
  }
  return dbPromise
}
