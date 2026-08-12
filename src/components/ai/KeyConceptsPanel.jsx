import { Button } from '../common/Button.jsx'
import { Spinner } from '../common/Spinner.jsx'
import { ResponseInspector } from './ResponseInspector.jsx'
import { useAI } from '../../hooks/useAI.js'
import { useTheme } from '../../hooks/useTheme.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { aiService } from '../../services/ai/aiService.js'
import './KeyConceptsPanel.css'

const PREFERENCE_LABELS = { auto: 'Auto', local: 'Local', cloud: 'Cloud' }

export function KeyConceptsPanel({ text, documentId, documentTitle }) {
  const { status, result, error, run } = useAI()
  const { aiPreference, setAIPreference, aiPreferences } = useTheme()
  const online = useOnlineStatus()

  const hasText = text.trim().length > 0
  const busy = status === 'loading'

  function handleExtract() {
    run(({ onProgress, signal }) =>
      aiService.extractKeyConcepts(text, {
        preference: aiPreference,
        isOnline: online,
        onProgress,
        signal,
        documentId,
        documentTitle,
      }),
    )
  }

  return (
    <section className="key-concepts-panel">
      <div className="key-concepts-panel__header">
        <h3 className="key-concepts-panel__heading">Key Concepts</h3>
        <Button type="button" variant="secondary" size="sm" onClick={handleExtract} disabled={busy || !hasText}>
          {busy ? 'Extracting…' : 'Extract'}
        </Button>
      </div>

      <div className="key-concepts-panel__preference" role="radiogroup" aria-label="AI provider preference">
        {aiPreferences.map((pref) => (
          <button
            key={pref}
            type="button"
            role="radio"
            aria-checked={aiPreference === pref}
            data-active={aiPreference === pref}
            onClick={() => setAIPreference(pref)}
          >
            {PREFERENCE_LABELS[pref]}
          </button>
        ))}
      </div>

      {!hasText ? (
        <p className="key-concepts-panel__hint">This document has no text to analyze.</p>
      ) : busy ? (
        <Spinner label="Extracting…" />
      ) : status === 'cancelled' ? (
        <div className="key-concepts-panel__error">
          <p>Cancelled.</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleExtract}>
            Try again
          </Button>
        </div>
      ) : status === 'error' ? (
        <div className="key-concepts-panel__error">
          <p>{error}</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleExtract}>
            Retry
          </Button>
        </div>
      ) : status === 'success' && result ? (
        <>
          <p className="key-concepts-panel__routing">
            <span className={`key-concepts-panel__badge key-concepts-panel__badge--${result.provider}`}>
              {result.provider === 'local' ? 'Local' : 'Cloud'}
            </span>
            {result.reason}
          </p>
          <ul className="key-concepts-panel__chips">
            {result.concepts.map((concept) => (
              <li key={concept} className="key-concepts-panel__chip">
                {concept}
              </li>
            ))}
          </ul>
          {result.provider === 'cloud' ? (
            <ResponseInspector
              status="Complete"
              provider="Cloud"
              model={result.model}
              durationMs={result.durationMs}
              characters={text.length}
              usage={result.usage}
            />
          ) : null}
        </>
      ) : (
        <p className="key-concepts-panel__hint">
          Extracts the most important topics from this document. "Auto" picks Local or Cloud based on document
          length; you can force either.
        </p>
      )}
    </section>
  )
}
