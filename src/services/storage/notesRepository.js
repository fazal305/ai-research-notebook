import { getDB, StorageError } from "./database.js";

const STORE = "notes";

function nowISO() {
  return new Date().toISOString();
}

/** All notes, newest-edited first. */
export async function listNotes() {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE);
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (cause) {
    throw new StorageError("Could not load notes.", cause);
  }
}

/** Notes linked to a specific document, newest-edited first. */
export async function listNotesByDocument(documentId) {
  try {
    const db = await getDB();
    const notes = await db.getAllFromIndex(STORE, "documentId", documentId);
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (cause) {
    throw new StorageError("Could not load notes for this document.", cause);
  }
}

export async function getNote(id) {
  try {
    const db = await getDB();
    return (await db.get(STORE, id)) ?? null;
  } catch (cause) {
    throw new StorageError("Could not load the note.", cause);
  }
}

export async function createNote({
  documentId = null,
  title = "Untitled note",
  content = "",
}) {
  const timestamp = nowISO();
  const note = {
    id: crypto.randomUUID(),
    documentId,
    title: title.trim() || "Untitled note",
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  try {
    const db = await getDB();
    await db.put(STORE, note);
    return note;
  } catch (cause) {
    throw new StorageError("Could not save the new note.", cause);
  }
}

export async function updateNote(id, patch) {
  try {
    const db = await getDB();
    const existing = await db.get(STORE, id);
    if (!existing) {
      throw new StorageError(`Note ${id} does not exist.`);
    }
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowISO(),
    };
    await db.put(STORE, updated);
    return updated;
  } catch (cause) {
    if (cause instanceof StorageError) throw cause;
    throw new StorageError("Could not save changes to the note.", cause);
  }
}

export async function deleteNote(id) {
  try {
    const db = await getDB();
    await db.delete(STORE, id);
  } catch (cause) {
    throw new StorageError("Could not delete the note.", cause);
  }
}
