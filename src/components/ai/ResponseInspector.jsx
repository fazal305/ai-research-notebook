import './ResponseInspector.css'

/**
 * Shows the mechanics of an AI response rather than just its content —
 * provider, model, timing, and real token usage. Token counts come only
 * from what the provider actually reports; when a provider doesn't expose
 * usage (or hasn't finished), this shows "Unavailable" rather than a
 * fabricated estimate.
 */
export function ResponseInspector({ status, provider, model, durationMs, characters, usage }) {
  return (
    <dl className="response-inspector">
      <div className="response-inspector__item">
        <dt>Status</dt>
        <dd>{status}</dd>
      </div>
      <div className="response-inspector__item">
        <dt>Provider</dt>
        <dd>{provider}</dd>
      </div>
      <div className="response-inspector__item">
        <dt>Model</dt>
        <dd>{model ?? 'Unavailable'}</dd>
      </div>
      <div className="response-inspector__item">
        <dt>Duration</dt>
        <dd>{durationMs != null ? `${(durationMs / 1000).toFixed(2)}s` : 'Unavailable'}</dd>
      </div>
      <div className="response-inspector__item">
        <dt>Characters</dt>
        <dd>{characters.toLocaleString()}</dd>
      </div>
      <div className="response-inspector__item response-inspector__item--wide">
        <dt>Tokens (input / output)</dt>
        <dd>
          {usage ? `${usage.input_tokens ?? '—'} / ${usage.output_tokens ?? '—'}` : 'Unavailable'}
        </dd>
      </div>
    </dl>
  )
}
