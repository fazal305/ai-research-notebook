import { Modal } from '../common/Modal.jsx'
import { Button } from '../common/Button.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import './SettingsModal.css'

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' }
const AI_PREFERENCE_LABELS = { auto: 'Automatic', local: 'Local only', cloud: 'Cloud only' }

const SHORTCUTS = [
  { keys: 'Ctrl + K', description: 'Open command palette' },
  { keys: 'Ctrl + S', description: 'Force-save the current document or note' },
  { keys: 'Ctrl + O', description: 'Import a document' },
  { keys: 'Ctrl + Enter', description: 'Analyze the current document (sentiment)' },
  { keys: 'Esc', description: 'Close a modal or the command palette' },
]

export function SettingsModal({ isOpen, onClose, onExportSession, onImportSession }) {
  const { theme, setTheme, themes, aiPreference, setAIPreference, aiPreferences } = useTheme()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="settings-modal">
        <section className="settings-modal__section">
          <h3>Theme</h3>
          <div className="settings-modal__options">
            {themes.map((option) => (
              <button
                key={option}
                type="button"
                data-active={theme === option}
                onClick={() => setTheme(option)}
              >
                {THEME_LABELS[option]}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-modal__section">
          <h3>AI Provider</h3>
          <p className="settings-modal__hint">
            Controls which provider "Key Concepts" uses when set to Automatic elsewhere in the app.
          </p>
          <div className="settings-modal__options">
            {aiPreferences.map((option) => (
              <button
                key={option}
                type="button"
                data-active={aiPreference === option}
                onClick={() => setAIPreference(option)}
              >
                {AI_PREFERENCE_LABELS[option]}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-modal__section">
          <h3>Research Data</h3>
          <p className="settings-modal__hint">
            Export everything — documents, notes, and AI history — as one file, or restore from a previous export.
          </p>
          <div className="settings-modal__data-actions">
            <Button type="button" variant="secondary" size="sm" onClick={onExportSession}>
              Export Research Session
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onImportSession}>
              Import Research Session
            </Button>
          </div>
        </section>

        <section className="settings-modal__section">
          <h3>Keyboard Shortcuts</h3>
          <dl className="settings-modal__shortcuts">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.keys} className="settings-modal__shortcut">
                <dt>
                  <kbd>{shortcut.keys}</kbd>
                </dt>
                <dd>{shortcut.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </Modal>
  )
}
