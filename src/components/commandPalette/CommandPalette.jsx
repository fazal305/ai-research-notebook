import { useEffect, useMemo, useRef, useState } from "react";
import * as notesRepository from "../../services/storage/notesRepository.js";
import * as historyRepository from "../../services/storage/historyRepository.js";
import { OPERATION_LABELS } from "../../services/ai/constants.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import "./CommandPalette.css";

const MAX_RESULTS_PER_GROUP = 5;

/**
 * Ctrl+K quick-open: doubles as both a command runner and unified search
 * across documents, notes, and AI history (see the project README's
 * Research Search section). Every command actually does something — no
 * placeholder entries.
 */
export function CommandPalette({
  isOpen,
  onClose,
  commands,
  documents,
  onSelectDocument,
  onOpenHistory,
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const paletteRef = useRef(null);

  useFocusTrap(paletteRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();

    Promise.all([notesRepository.listNotes(), historyRepository.listHistory()])
      .then(([notesList, historyList]) => {
        setNotes(notesList);
        setHistory(historyList);
      })
      .catch(() => {
        setNotes([]);
        setHistory([]);
      });
  }, [isOpen]);

  const groups = useMemo(() => {
    // Hooks can't be called conditionally, but the filtering work itself
    // can be skipped — this recomputes on every AppContent render
    // otherwise, even while closed.
    if (!isOpen) return [];

    const q = query.trim().toLowerCase();

    const commandResults = (
      q
        ? commands.filter((cmd) => cmd.label.toLowerCase().includes(q))
        : commands
    ).map((cmd) => ({
      type: "command",
      key: `command-${cmd.id}`,
      label: cmd.label,
      run: cmd.run,
    }));

    if (!q) {
      return [{ title: "Commands", items: commandResults }];
    }

    const documentResults = documents
      .filter((doc) => doc.title.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((doc) => ({
        type: "document",
        key: `document-${doc.id}`,
        label: doc.title,
        run: () => onSelectDocument(doc.id),
      }));

    const noteResults = notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((note) => ({
        type: "note",
        key: `note-${note.id}`,
        label: note.title,
        run: () => note.documentId && onSelectDocument(note.documentId),
      }));

    const historyResults = history
      .filter(
        (entry) =>
          (entry.documentTitle ?? "").toLowerCase().includes(q) ||
          (entry.prompt ?? "").toLowerCase().includes(q) ||
          (entry.response ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((entry) => ({
        type: "history",
        key: `history-${entry.id}`,
        label: `${OPERATION_LABELS[entry.operation] ?? entry.operation} · ${entry.documentTitle ?? "Untitled"}`,
        run: () => onOpenHistory(),
      }));

    return [
      { title: "Commands", items: commandResults },
      { title: "Documents", items: documentResults },
      { title: "Notes", items: noteResults },
      { title: "AI History", items: historyResults },
    ];
  }, [
    isOpen,
    query,
    commands,
    documents,
    notes,
    history,
    onSelectDocument,
    onOpenHistory,
  ]);

  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  useEffect(() => {
    if (activeIndex >= flatResults.length)
      setActiveIndex(Math.max(0, flatResults.length - 1));
  }, [flatResults.length, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const target = flatResults[activeIndex];
        if (target) {
          target.run();
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, activeIndex, onClose]);

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <div
      className="command-palette-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        ref={paletteRef}
      >
        <input
          ref={inputRef}
          className="command-palette__input"
          type="text"
          placeholder="Search commands, documents, notes, history…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search commands and research"
        />

        <div className="command-palette__results scrollable">
          {flatResults.length === 0 ? (
            <p className="command-palette__empty">No matches.</p>
          ) : (
            groups.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.title} className="command-palette__group">
                  <p className="command-palette__group-title">{group.title}</p>
                  {group.items.map((item) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className="command-palette__item"
                        data-active={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          item.run();
                          onClose();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
