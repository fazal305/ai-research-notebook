import { Spinner } from '../common/Spinner.jsx'
import { Button } from '../common/Button.jsx'
import './AppStatusScreen.css'

/** Full-screen loading state shown while the local database is opening. */
export function AppLoadingScreen() {
  return (
    <div className="app-status-screen">
      <Spinner size={22} label="Opening local database…" />
    </div>
  )
}

/**
 * Full-screen error state for when IndexedDB fails to open entirely
 * (e.g. private browsing mode in some browsers, corrupted storage, or the
 * origin's storage quota/permissions being denied). This is a hard
 * failure — without a database the app has nothing to show — so it
 * replaces the whole UI rather than degrading a single panel.
 */
export function AppErrorScreen({ error, onRetry }) {
  return (
    <div className="app-status-screen">
      <div className="app-status-screen__card">
        <p className="app-status-screen__title">Local storage unavailable</p>
        <p className="app-status-screen__description">
          {error?.message ?? 'The browser refused to open the local database.'} This can happen in
          private/incognito browsing or if storage permissions are blocked for this site.
        </p>
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}
