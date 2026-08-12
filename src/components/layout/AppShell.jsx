import { useState } from 'react'
import { AppHeader } from './AppHeader.jsx'
import './AppShell.css'

const MOBILE_PANELS = [
  { id: 'documents', label: 'Documents' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'ai', label: 'Analysis' },
]

/**
 * Top-level layout: header + a 3-column workspace grid (sidebar / editor /
 * AI panel) on wide screens.
 *
 * On narrow screens a 3-column grid stops being usable, so instead of
 * shrinking it we switch to one panel at a time behind a bottom tab bar.
 * All three panels stay mounted (just hidden via CSS) so editor/notes state
 * isn't lost when switching tabs.
 */
export function AppShell({
  statusLabel,
  statusTone,
  onOpenCommandPalette,
  onOpenHistory,
  onOpenSettings,
  sidebar,
  workspace,
  aiPanel,
}) {
  const [activeMobilePanel, setActiveMobilePanel] = useState('workspace')

  return (
    <div className="app-shell">
      <AppHeader
        statusLabel={statusLabel}
        statusTone={statusTone}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenHistory={onOpenHistory}
        onOpenSettings={onOpenSettings}
      />

      <div className="app-shell__body">
        <aside
          className="app-shell__panel app-shell__sidebar"
          data-mobile-active={activeMobilePanel === 'documents'}
          aria-label="Documents"
        >
          {sidebar}
        </aside>

        <main
          className="app-shell__panel app-shell__workspace"
          data-mobile-active={activeMobilePanel === 'workspace'}
          aria-label="Research workspace"
        >
          {workspace}
        </main>

        <section
          className="app-shell__panel app-shell__ai"
          data-mobile-active={activeMobilePanel === 'ai'}
          aria-label="AI analysis"
        >
          {aiPanel}
        </section>
      </div>

      <nav className="app-shell__mobile-tabs" aria-label="Panel switcher">
        {MOBILE_PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className="app-shell__mobile-tab"
            data-active={activeMobilePanel === panel.id}
            onClick={() => setActiveMobilePanel(panel.id)}
            aria-current={activeMobilePanel === panel.id ? 'page' : undefined}
          >
            {panel.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
