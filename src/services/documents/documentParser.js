/**
 * Registry of supported document types. To support a new file format later
 * (e.g. .csv), add an entry here — nothing else in the app needs to change,
 * since import/export/type-badges all read from this registry.
 */
const DOCUMENT_TYPES = {
  txt: {
    label: "Plain Text",
    extensions: [".txt"],
    mimeType: "text/plain",
    parse: (rawText) => rawText,
  },
  md: {
    label: "Markdown",
    extensions: [".md", ".markdown"],
    mimeType: "text/markdown",
    parse: (rawText) => rawText,
  },
  json: {
    label: "JSON",
    extensions: [".json"],
    mimeType: "application/json",
    parse: (rawText) => {
      try {
        return JSON.stringify(JSON.parse(rawText), null, 2);
      } catch {
        throw new Error("This file is not valid JSON.");
      }
    },
  },
};

export function getDocumentTypeMeta(type) {
  return DOCUMENT_TYPES[type] ?? null;
}

export function getSupportedExtensions() {
  return Object.values(DOCUMENT_TYPES).flatMap((t) => t.extensions);
}

export function detectTypeFromFilename(filename) {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const ext = filename.slice(dotIndex).toLowerCase();
  const entry = Object.entries(DOCUMENT_TYPES).find(([, meta]) =>
    meta.extensions.includes(ext),
  );
  return entry ? entry[0] : null;
}

function stripExtension(filename) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? filename : filename.slice(0, dotIndex);
}

/** Reads a File, validates it against the registry, and returns document-ready fields. */
export async function parseImportedFile(file) {
  const type = detectTypeFromFilename(file.name);
  if (!type) {
    throw new Error(
      `Unsupported file type for "${file.name}". Supported: ${getSupportedExtensions().join(", ")}`,
    );
  }

  const rawText = await file.text();
  const content = DOCUMENT_TYPES[type].parse(rawText);

  return {
    title: stripExtension(file.name),
    type,
    content,
  };
}
