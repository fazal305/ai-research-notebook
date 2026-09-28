import { getDB, StorageError } from "./database.js";

const STORE = "documents";

function nowISO() {
  return new Date().toISOString();
}

function byteSize(content) {
  return new Blob([content]).size;
}

/** All documents, newest-edited first. */
export async function listDocuments() {
  try {
    const db = await getDB();
    const all = await db.getAll(STORE);
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (cause) {
    throw new StorageError("Could not load documents.", cause);
  }
}

export async function getDocument(id) {
  try {
    const db = await getDB();
    return (await db.get(STORE, id)) ?? null;
  } catch (cause) {
    throw new StorageError("Could not load the document.", cause);
  }
}

export async function createDocument({ title, type = "txt", content = "" }) {
  if (!title || !title.trim()) {
    throw new StorageError("A document needs a title.");
  }
  const timestamp = nowISO();
  const doc = {
    id: crypto.randomUUID(),
    title: title.trim(),
    type,
    content,
    size: byteSize(content),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  try {
    const db = await getDB();
    await db.put(STORE, doc);
    return doc;
  } catch (cause) {
    throw new StorageError("Could not save the new document.", cause);
  }
}

/** Shallow-merges `patch` into the stored document and bumps updatedAt. */
export async function updateDocument(id, patch) {
  try {
    const db = await getDB();
    const existing = await db.get(STORE, id);
    if (!existing) {
      throw new StorageError(`Document ${id} does not exist.`);
    }
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowISO(),
    };
    if (patch.content !== undefined) {
      updated.size = byteSize(updated.content);
    }
    await db.put(STORE, updated);
    return updated;
  } catch (cause) {
    if (cause instanceof StorageError) throw cause;
    throw new StorageError("Could not save changes to the document.", cause);
  }
}

export async function deleteDocument(id) {
  try {
    const db = await getDB();
    await db.delete(STORE, id);
  } catch (cause) {
    throw new StorageError("Could not delete the document.", cause);
  }
}

export async function duplicateDocument(id) {
  const original = await getDocument(id);
  if (!original) {
    throw new StorageError(`Document ${id} does not exist.`);
  }
  return createDocument({
    title: `${original.title} (copy)`,
    type: original.type,
    content: original.content,
  });
}
