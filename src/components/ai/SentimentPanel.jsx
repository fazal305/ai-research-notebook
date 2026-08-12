import { useEffect } from 'react'
import { Button } from '../common/Button.jsx'
import { Spinner } from '../common/Spinner.jsx'
import { useAI } from '../../hooks/useAI.js'
import { aiService } from '../../services/ai/aiService.js'
import { onAnalyzeRequest } from '../../utils/analyzeBus.js'
import './SentimentPanel.css'

function progressLabel(progress) {
  if (!progress) return 'Loading model…'
  if (progress.status === 'progress' && typeof progress.progress === 'number') {
    return `Downloading model… ${Math.round(progress.progress)}% (${progress.file ?? ''})`
  }
  if (progress.status === 'initiate') return `Fetching ${progress.file ?? 'model files'}…`
  if (progress.status === 'done') return `Preparing ${progress.file ?? 'model'}…`
  return 'Loading model…'
}

export function SentimentPanel({ text, documentId, documentTitle }) {
  const { status, progress, result, error, run } = useAI()

  const busy = status === 'loading'
  const hasText = text.trim().length > 0

  function handleAnalyze() {
    run(({ onProgress }) => aiService.analyzeSentiment(text, { onProgress, documentId, documentTitle }))
  }

  // Ctrl+Enter (global shortcut, see useKeyboardShortcuts) — the "quick
  // analyze" action for the currently selected document. Sentiment is the
  // right default: it's local, fast, and needs no network.
  useEffect(() => {
    return onAnalyzeRequest(() => {
      if (!busy && hasText) handleAnalyze()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, hasText, text])

  return (
    <section className="sentiment-panel">
      <div className="sentiment-panel__header">
        <h3 className="sentiment-panel__heading">Sentiment (Local AI)</h3>
        <Button type="button" variant="secondary" size="sm" onClick={handleAnalyze} disabled={busy || !hasText}>
          {busy ? 'Analyzing…' : 'Analyze Locally'}
        </Button>
      </div>

      {!hasText ? (
        <p className="sentiment-panel__hint">This document has no text to analyze.</p>
      ) : busy ? (
        <Spinner label={progressLabel(progress)} />
      ) : status === 'error' ? (
        <div className="sentiment-panel__error">
          <p>{error}</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAnalyze}>
            Retry
          </Button>
        </div>
      ) : status === 'success' && result ? (
        <div className="sentiment-panel__result">
          <span className={`sentiment-panel__label sentiment-panel__label--${result.label.toLowerCase()}`}>
            {result.label === 'POSITIVE' ? 'Positive' : 'Negative'}
          </span>
          <div className="sentiment-panel__confidence">
            <span>Confidence</span>
            <span>{Math.round(result.score * 100)}%</span>
          </div>
        </div>
      ) : (
        <p className="sentiment-panel__hint">
          Runs entirely in your browser via a Web Worker — nothing is sent over the network. The model (~65MB)
          downloads once and is cached by the browser.
        </p>
      )}
    </section>
  )
}
