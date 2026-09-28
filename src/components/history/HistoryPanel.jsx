import { useMemo, useState } from "react";
import { SearchInput } from "../common/SearchInput.jsx";
import { Button } from "../common/Button.jsx";
import { ConfirmButton } from "../common/ConfirmButton.jsx";
import { EmptyState } from "../common/EmptyState.jsx";
import { Spinner } from "../common/Spinner.jsx";
import { ResponseInspector } from "../ai/ResponseInspector.jsx";
import { useHistory } from "../../hooks/useHistory.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { formatRelativeTime } from "../../utils/fileUtils.js";
import { OPERATION_LABELS } from "../../services/ai/constants.js";
import "./HistoryPanel.css";

const STATUS_LABELS = {
  complete: "Complete",
  error: "Error",
  cancelled: "Cancelled",
};

export function HistoryPanel({ onOpenDocument }) {
  const { entries, status, error, deleteEntry, clearAll } = useHistory();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [copyState, setCopyState] = useState("idle");
  const debouncedQuery = useDebounce(query, 200);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        (entry.documentTitle ?? "").toLowerCase().includes(q) ||
        (entry.prompt ?? "").toLowerCase().includes(q) ||
        (entry.response ?? "").toLowerCase().includes(q) ||
        (OPERATION_LABELS[entry.operation] ?? entry.operation ?? "")
          .toLowerCase()
          .includes(q) ||
        entry.provider.toLowerCase().includes(q),
    );
  }, [entries, debouncedQuery]);

  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <div className="history-panel">
      <div className="history-panel__toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search history…"
        />
        {entries.length > 0 ? (
          <ConfirmButton
            variant="ghost"
            size="sm"
            confirmLabel="Confirm clear"
            onConfirm={clearAll}
          >
            Clear All
          </ConfirmButton>
        ) : null}
      </div>

      <div className="history-panel__body">
        <div className="history-panel__list scrollable">
          {status === "loading" ? (
            <Spinner label="Loading history…" />
          ) : status === "error" ? (
            <EmptyState
              title="Couldn't load history"
              description={error?.message}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={debouncedQuery ? "No matches" : "No AI history yet"}
              description={
                debouncedQuery
                  ? "No entries match your search."
                  : "Results from AI analysis will appear here."
              }
            />
          ) : (
            <ul>
              {filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="history-item"
                  data-selected={entry.id === selectedId}
                >
                  <button
                    type="button"
                    className="history-item__main"
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <span className="history-item__top">
                      <span
                        className={`history-item__badge history-item__badge--${entry.provider}`}
                      >
                        {entry.provider === "local" ? "Local" : "Cloud"}
                      </span>
                      <span className="history-item__operation">
                        {OPERATION_LABELS[entry.operation] ?? entry.operation}
                      </span>
                    </span>
                    <span className="history-item__doc">
                      {entry.documentTitle ?? "Untitled document"}
                    </span>
                    <span className="history-item__meta">
                      <span
                        className={`history-item__status history-item__status--${entry.status}`}
                      >
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                      <span>{formatRelativeTime(entry.timestamp)}</span>
                    </span>
                  </button>
                  <ConfirmButton
                    className="history-item__delete"
                    variant="ghost"
                    size="sm"
                    confirmLabel="✓"
                    onConfirm={() => deleteEntry(entry.id)}
                    aria-label="Delete entry"
                    title="Delete"
                  >
                    ✕
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="history-panel__detail scrollable">
          {!selected ? (
            <EmptyState
              title="No entry selected"
              description="Choose an entry from the list to view its full response."
            />
          ) : (
            <>
              <div className="history-detail__header">
                <h3>
                  {OPERATION_LABELS[selected.operation] ?? selected.operation}
                </h3>
                <div className="history-detail__actions">
                  {selected.documentId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDocument(selected.documentId)}
                    >
                      Open Document
                    </Button>
                  ) : null}
                  {selected.response ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(selected.response)}
                    >
                      {copyState === "copied"
                        ? "Copied"
                        : copyState === "error"
                          ? "Couldn't copy"
                          : "Copy"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <p className="history-detail__doc">
                {selected.documentTitle ?? "Untitled document"}
              </p>

              {selected.status === "error" ? (
                <p className="history-detail__error">{selected.error}</p>
              ) : selected.status === "cancelled" ? (
                <p className="history-detail__cancelled">
                  Cancelled before completion.
                </p>
              ) : (
                <p className="history-detail__response">{selected.response}</p>
              )}

              <ResponseInspector
                status={STATUS_LABELS[selected.status] ?? selected.status}
                provider={selected.provider === "local" ? "Local" : "Cloud"}
                model={selected.model}
                durationMs={selected.durationMs}
                characters={selected.response?.length ?? 0}
                usage={selected.tokenUsage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
