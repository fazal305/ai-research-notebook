import { SaveIndicator } from '../common/SaveIndicator.jsx'
import { useAutosaveField } from '../../hooks/useAutosaveField.js'
import { textStats } from '../../utils/textUtils.js'
import { formatBytes } from '../../utils/fileUtils.js'
import './DocumentEditor.css'

/**
 * The document body editor. Rendered inside WorkspacePanel, which remounts
 * this (via `key={doc.id}`) whenever the selected document changes — see
 * useAutosaveField's docstring for why that matters.
 */
export function DocumentEditor({ doc, updateDocument }) {
  const [title, setTitle] = useAutosaveField(doc.title, (value) => updateDocument(doc.id, { title: value }), 800)
  const [content, setContent, contentSaveState] = useAutosaveField(
    doc.content,
    (value) => updateDocument(doc.id, { content: value }),
    600,
  )

  const stats = textStats(content)

  return (
    <div className="doc-editor">
      <div className="doc-editor__title-row">
        <input
          className="doc-editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Document title"
        />
        <SaveIndicator state={contentSaveState} />
      </div>

      <div className="doc-editor__meta">
        <span>{doc.type.toUpperCase()}</span>
        <span>{formatBytes(doc.size)}</span>
        <span>{stats.words} words</span>
        <span>{stats.readingMinutes} min read</span>
        <span>Created {new Date(doc.createdAt).toLocaleDateString()}</span>
      </div>

      <textarea
        className="doc-editor__content scrollable"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        aria-label="Document content"
      />
    </div>
  )
}
