import { getDB, StorageError } from './database.js'

const STORE = 'settings'

export async function getSetting(key, fallback = null) {
  try {
    const db = await getDB()
    const record = await db.get(STORE, key)
    return record ? record.value : fallback
  } catch (cause) {
    throw new StorageError(`Could not load setting "${key}".`, cause)
  }
}

export async function setSetting(key, value) {
  try {
    const db = await getDB()
    await db.put(STORE, { key, value })
  } catch (cause) {
    throw new StorageError(`Could not save setting "${key}".`, cause)
  }
}

export async function getAllSettings() {
  try {
    const db = await getDB()
    const records = await db.getAll(STORE)
    return Object.fromEntries(records.map((r) => [r.key, r.value]))
  } catch (cause) {
    throw new StorageError('Could not load settings.', cause)
  }
}
