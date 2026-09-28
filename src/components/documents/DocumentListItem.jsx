import { useEffect, useRef, useState } from "react";
import { ConfirmButton } from "../common/ConfirmButton.jsx";
import { formatBytes, formatRelativeTime } from "../../utils/fileUtils.js";
import { exportDocument } from "../../services/documents/documentExporter.js";
import "./DocumentListItem.css";

export function DocumentListItem({
  document,
  isSelected,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}) {
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(document.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  function commitRename() {
    const trimmed = draftTitle.trim();
    setRenaming(false);
    if (trimmed && trimmed !== document.title) {
      onRename(trimmed);
    } else {
      setDraftTitle(document.title);
    }
  }

  return (
    <li className="doc-item" data-selected={isSelected}>
      <button
        type="button"
        className="doc-item__main"
        onClick={() => onSelect(document.id)}
        aria-current={isSelected ? "true" : undefined}
      >
        {renaming ? (
          <input
            ref={inputRef}
            className="doc-item__rename-input"
            value={draftTitle}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                setDraftTitle(document.title);
                setRenaming(false);
              }
            }}
            aria-label="Document title"
          />
        ) : (
          <span className="doc-item__title">{document.title}</span>
        )}
        <span className="doc-item__meta">
          <span className={`doc-item__badge doc-item__badge--${document.type}`}>
            {document.type}
          </span>
          <span>{formatBytes(document.size)}</span>
          <span>{formatRelativeTime(document.updatedAt)}</span>
        </span>
      </button>

      <div className="doc-item__actions">
        <button
          type="button"
          className="doc-item__icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            setDraftTitle(document.title);
            setRenaming(true);
          }}
          aria-label={`Rename ${document.title}`}
          title="Rename"
        >
          ✎
        </button>
        <button
          type="button"
          className="doc-item__icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          aria-label={`Duplicate ${document.title}`}
          title="Duplicate"
        >
          ⧉
        </button>
        <button
          type="button"
          className="doc-item__icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            exportDocument(document);
          }}
          aria-label={`Export ${document.title}`}
          title="Export"
        >
          ⭳
        </button>
        <ConfirmButton
          className="doc-item__icon-btn doc-item__icon-btn--confirm"
          variant="ghost"
          confirmLabel="✓"
          onConfirm={onDelete}
          aria-label={`Delete ${document.title}`}
          title="Delete"
        >
          ✕
        </ConfirmButton>
      </div>
    </li>
  );
}
