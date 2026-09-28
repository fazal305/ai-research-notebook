import { getDB, StorageError } from "./database.js";

const STORE = "aiHistory";

/**
 * A history entry represents one AI request/response cycle. Shape (all
 * fields set by the caller — this repository just persists them):
 *   id, documentId, operation, provider, model, prompt, response,
 *   status ('complete' | 'error' | 'cancelled'), timestamp, durationMs,
 *   tokenUsage (real usage object from the provider, or null if unavailable
 *   — never fabricated), error (message string, if status is 'error')
 */

/** All history entries, newest first. */
export async function listHistory() {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE);
    return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (cause) {
    throw new StorageError("Could not load AI history.", cause);
  }
}

export async function listHistoryByDocument(documentId) {
  try {
    const db = await getDB();
    const entries = await db.getAllFromIndex(STORE, "documentId", documentId);
    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (cause) {
    throw new StorageError(
      "Could not load AI history for this document.",
      cause,
    );
  }
}

export async function countHistoryByDocument(documentId) {
  try {
    const db = await getDB();
    return await db.countFromIndex(STORE, "documentId", documentId);
  } catch (cause) {
    throw new StorageError(
      "Could not count AI history for this document.",
      cause,
    );
  }
}

export async function addHistoryEntry(entry) {
  const record = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  try {
    const db = await getDB();
    await db.put(STORE, record);
    return record;
  } catch (cause) {
    throw new StorageError("Could not save the AI history entry.", cause);
  }
}

export async function deleteHistoryEntry(id) {
  try {
    const db = await getDB();
    await db.delete(STORE, id);
  } catch (cause) {
    throw new StorageError("Could not delete the history entry.", cause);
  }
}

export async function clearHistory() {
  try {
    const db = await getDB();
    await db.clear(STORE);
  } catch (cause) {
    throw new StorageError("Could not clear AI history.", cause);
  }
}
