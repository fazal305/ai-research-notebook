import { DocumentListItem } from './DocumentListItem.jsx'
import { EmptyState } from '../common/EmptyState.jsx'
import { Spinner } from '../common/Spinner.jsx'

export function DocumentList({ documents, status, error, selectedDocumentId, onSelect, onRename, onDuplicate, onDelete, hasQuery }) {
  if (status === 'loading') {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <Spinner label="Loading documents…" />
      </div>
    )
  }

  if (status === 'error') {
    return <EmptyState title="Couldn't load documents" description={error?.message} />
  }

  if (documents.length === 0) {
    return hasQuery ? (
      <EmptyState title="No matches" description="No documents match your search." />
    ) : (
      <EmptyState
        title="No documents yet"
        description="Create a new document or import a .txt, .md, or .json file to get started."
      />
    )
  }

  return (
    <ul>
      {documents.map((doc) => (
        <DocumentListItem
          key={doc.id}
          document={doc}
          isSelected={doc.id === selectedDocumentId}
          onSelect={onSelect}
          onRename={(title) => onRename(doc.id, title)}
          onDuplicate={() => onDuplicate(doc.id)}
          onDelete={() => onDelete(doc.id)}
        />
      ))}
    </ul>
  )
}
