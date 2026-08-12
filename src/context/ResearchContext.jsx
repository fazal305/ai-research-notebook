import { createContext, useCallback, useMemo, useState } from 'react'
import { useDocuments } from '../hooks/useDocuments.js'

/**
 * App-level research state: the document list (via useDocuments) plus
 * which document is currently selected. Selection lives here — rather
 * than in the sidebar or the editor — because both the workspace editor
 * and the AI panel need to know it, and lifting it into App.jsx would mean
 * prop-drilling through the AppShell composition.
 */
export const ResearchContext = createContext(null)

export function ResearchProvider({ children }) {
  const documentsApi = useDocuments()
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)

  const selectDocument = useCallback((id) => {
    setSelectedDocumentId(id)
  }, [])

  const selectedDocument = useMemo(
    () => documentsApi.documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documentsApi.documents, selectedDocumentId],
  )

  // If the selected document was deleted, clear the stale selection.
  const deleteDocument = useCallback(
    async (id) => {
      await documentsApi.deleteDocument(id)
      setSelectedDocumentId((current) => (current === id ? null : current))
    },
    [documentsApi],
  )

  const value = useMemo(
    () => ({
      ...documentsApi,
      deleteDocument,
      selectedDocumentId,
      selectedDocument,
      selectDocument,
    }),
    [documentsApi, deleteDocument, selectedDocumentId, selectedDocument, selectDocument],
  )

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>
}
