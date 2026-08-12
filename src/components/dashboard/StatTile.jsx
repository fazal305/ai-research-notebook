import './StatTile.css'

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact' })

export function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__value">{compactFormatter.format(value)}</span>
      <span className="stat-tile__label">{label}</span>
    </div>
  )
}
