const VALID_DOCUMENT_TYPES = ["txt", "md", "json"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates and sanitizes an imported research-session object.
 * Never trusts the file: unrecognized top-level shape throws (nothing to
 * salvage); individual malformed documents/notes/history entries are
 * skipped and reported rather than aborting the whole import — one bad
 * record shouldn't block the rest of a session from restoring.
 */
export function validateSessionData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("This file does not contain a valid research session.");
  }

  const warnings = [];
  const rawDocuments = Array.isArray(data.documents) ? data.documents : [];
  const rawNotes = Array.isArray(data.notes) ? data.notes : [];
  const rawHistory = Array.isArray(data.history) ? data.history : [];

  if (!Array.isArray(data.documents) && data.documents !== undefined) {
    warnings.push('"documents" was present but not an array — ignored.');
  }
  if (!Array.isArray(data.notes) && data.notes !== undefined) {
    warnings.push('"notes" was present but not an array — ignored.');
  }
  if (!Array.isArray(data.history) && data.history !== undefined) {
    warnings.push('"history" was present but not an array — ignored.');
  }

  const documents = [];
  rawDocuments.forEach((doc, index) => {
    if (
      !doc ||
      typeof doc !== "object" ||
      !isNonEmptyString(doc.title) ||
      typeof doc.content !== "string" ||
      !VALID_DOCUMENT_TYPES.includes(doc.type)
    ) {
      warnings.push(
        `Skipped document at index ${index}: missing or invalid title/type/content.`,
      );
      return;
    }
    documents.push({
      originalId: doc.id ?? null,
      title: doc.title,
      type: doc.type,
      content: doc.content,
    });
  });

  const notes = [];
  rawNotes.forEach((note, index) => {
    if (
      !note ||
      typeof note !== "object" ||
      !isNonEmptyString(note.title) ||
      typeof note.content !== "string"
    ) {
      warnings.push(
        `Skipped note at index ${index}: missing or invalid title/content.`,
      );
      return;
    }
    notes.push({
      originalId: note.id ?? null,
      originalDocumentId: note.documentId ?? null,
      title: note.title,
      content: note.content,
    });
  });

  const history = [];
  rawHistory.forEach((entry, index) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !isNonEmptyString(entry.operation) ||
      !isNonEmptyString(entry.provider) ||
      !isNonEmptyString(entry.status)
    ) {
      warnings.push(
        `Skipped AI history entry at index ${index}: missing required fields.`,
      );
      return;
    }
    history.push({
      originalDocumentId: entry.documentId ?? null,
      documentTitle:
        typeof entry.documentTitle === "string" ? entry.documentTitle : null,
      operation: entry.operation,
      provider: entry.provider,
      model: typeof entry.model === "string" ? entry.model : null,
      prompt: typeof entry.prompt === "string" ? entry.prompt : "",
      response: typeof entry.response === "string" ? entry.response : null,
      status: entry.status,
      durationMs:
        typeof entry.durationMs === "number" ? entry.durationMs : null,
      tokenUsage:
        entry.tokenUsage && typeof entry.tokenUsage === "object"
          ? entry.tokenUsage
          : null,
      error: typeof entry.error === "string" ? entry.error : null,
    });
  });

  return { documents, notes, history, warnings };
}
