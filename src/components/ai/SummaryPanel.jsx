import { Button } from "../common/Button.jsx";
import { ResponseInspector } from "./ResponseInspector.jsx";
import { useAI } from "../../hooks/useAI.js";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { aiService } from "../../services/ai/aiService.js";
import "./SummaryPanel.css";

export function SummaryPanel({ text, documentId, documentTitle }) {
  const { status, progress, result, error, run, cancel } = useAI();
  const online = useOnlineStatus();

  const hasText = text.trim().length > 0;
  const busy = status === "loading";
  const displayText = busy ? progress : (result?.text ?? progress);

  function handleSummarize() {
    // aiService already measures and returns durationMs (it needs to for
    // the history entry it records), so there's nothing to compute here.
    run(({ onChunk, signal }) =>
      aiService.summarize(text, { onChunk, signal, documentId, documentTitle }),
    );
  }

  return (
    <section className="summary-panel">
      <div className="summary-panel__header">
        <h3 className="summary-panel__heading">Summary (Cloud AI)</h3>
        {busy ? (
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSummarize}
            disabled={!hasText || !online}
          >
            Summarize with Cloud AI
          </Button>
        )}
      </div>

      {!online ? (
        <div className="summary-panel__offline">
          <p>Cloud AI unavailable — you're offline.</p>
          <p className="summary-panel__offline-list">
            You can still use: local analysis, saved documents, research notes,
            and previous results.
          </p>
        </div>
      ) : !hasText ? (
        <p className="summary-panel__hint">
          This document has no text to summarize.
        </p>
      ) : status === "cancelled" ? (
        <div className="summary-panel__error">
          <p>Generation cancelled.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
          >
            Try again
          </Button>
        </div>
      ) : status === "error" ? (
        <div className="summary-panel__error">
          <p>{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
          >
            Retry
          </Button>
        </div>
      ) : displayText ? (
        <>
          <p className="summary-panel__text">
            {displayText}
            {busy ? (
              <span className="summary-panel__cursor" aria-hidden="true" />
            ) : null}
          </p>
          {status === "success" && result ? (
            <ResponseInspector
              status="Complete"
              provider="Cloud"
              model={result.model}
              durationMs={result.durationMs}
              characters={result.text.length}
              usage={result.usage}
            />
          ) : null}
        </>
      ) : (
        <p className="summary-panel__hint">
          Sends the document text to Claude for a concise summary. Requires
          cloud AI to be configured — see the README if you haven't set up an
          API key yet.
        </p>
      )}
    </section>
  );
}
