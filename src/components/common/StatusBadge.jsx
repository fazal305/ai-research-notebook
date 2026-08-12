import './StatusBadge.css'

const TONES = {
  ready: 'ready',
  busy: 'busy',
  offline: 'offline',
  error: 'error',
}

/**
 * Small "dot + label" indicator used in the header to show current
 * connectivity / processing state, e.g. "Local / Ready" or "Cloud / Analyzing".
 */
export function StatusBadge({ label, tone = 'ready' }) {
  const resolvedTone = TONES[tone] ?? TONES.ready
  return (
    <span className={`status-badge status-badge--${resolvedTone}`} role="status">
      <span className="status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
