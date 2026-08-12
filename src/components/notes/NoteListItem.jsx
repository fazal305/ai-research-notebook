import { ConfirmButton } from '../common/ConfirmButton.jsx'
import { formatRelativeTime } from '../../utils/fileUtils.js'
import './NoteListItem.css'

function snippet(content) {
  const flat = content.replace(/\s+/g, ' ').trim()
  return flat.length > 70 ? `${flat.slice(0, 70)}…` : flat
}

export function NoteListItem({ note, isSelected, onSelect, onDelete }) {
  return (
    <li className="note-item" data-selected={isSelected}>
      <button type="button" className="note-item__main" onClick={() => onSelect(note.id)}>
        <span className="note-item__title">{note.title}</span>
        <span className="note-item__snippet">{snippet(note.content) || 'Empty note'}</span>
        <span className="note-item__time">{formatRelativeTime(note.updatedAt)}</span>
      </button>
      <ConfirmButton
        className="note-item__delete"
        variant="ghost"
        size="sm"
        confirmLabel="✓"
        onConfirm={onDelete}
        aria-label={`Delete ${note.title}`}
        title="Delete"
      >
        ✕
      </ConfirmButton>
    </li>
  )
}
