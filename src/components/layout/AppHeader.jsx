import { StatusBadge } from '../common/StatusBadge.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import './AppHeader.css'

const THEME_ICON = { light: '☀', dark: '☾', system: '◐' }
const THEME_LABEL = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' }

export function AppHeader({ statusLabel, statusTone, onOpenCommandPalette, onOpenHistory, onOpenSettings }) {
  const { theme, cycleTheme } = useTheme()

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__title">AI Research Notebook</span>
      </div>

      <div className="app-header__actions">
        <StatusBadge label={statusLabel} tone={statusTone} />

        <button
          type="button"
          className="app-header__icon-btn app-header__cmdk"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
          title="Command palette"
        >
          <span>⌘K</span>
        </button>

        <button
          type="button"
          className="app-header__icon-btn"
          onClick={onOpenHistory}
          aria-label="Open AI history"
          title="AI History"
        >
          🕓
        </button>

        <button
          type="button"
          className="app-header__icon-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          ⚙
        </button>

        <button
          type="button"
          className="app-header__icon-btn"
          onClick={cycleTheme}
          aria-label={`Theme: ${THEME_LABEL[theme]}. Click to change.`}
          title={THEME_LABEL[theme]}
        >
          {THEME_ICON[theme]}
        </button>
      </div>
    </header>
  )
}
