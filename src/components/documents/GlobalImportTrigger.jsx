import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  getSupportedExtensions,
  parseImportedFile,
} from "../../services/documents/documentParser.js";

/**
 * Invisible file input, opened imperatively (Ctrl+O, the command
 * palette's "Import Document") rather than from its own visible button —
 * the sidebar's ImportButton is the primary, fully-error-surfaced import
 * UI; this is the shortcut path into the same logic.
 */
export const GlobalImportTrigger = forwardRef(function GlobalImportTrigger(
  { onImport, onError },
  ref,
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => inputRef.current?.click(),
  }));

  async function handleChange(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const file of files) {
      try {
        const parsed = await parseImportedFile(file);
        await onImport(parsed);
      } catch (err) {
        onError?.(`${file.name}: ${err.message}`);
      }
    }
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept={getSupportedExtensions().join(",")}
      multiple
      onChange={handleChange}
      className="visually-hidden"
      aria-label="Import documents (keyboard shortcut)"
      tabIndex={-1}
    />
  );
});
