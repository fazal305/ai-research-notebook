import { useCallback, useEffect, useState } from 'react'
import * as documentRepository from '../services/storage/documentRepository.js'

/**
 * Loads the document list from IndexedDB into React state and exposes
 * mutations that keep the two in sync. This is the only place that talks
 * to documentRepository directly for the document list — components go
 * through this hook (via ResearchContext) instead of hitting the
 * repository themselves.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const docs = await documentRepository.listDocuments()
      setDocuments(docs)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const createDocument = useCallback(async (input) => {
    const doc = await documentRepository.createDocument(input)
    setDocuments((prev) => [doc, ...prev])
    return doc
  }, [])

  const updateDocument = useCallback(async (id, patch) => {
    const updated = await documentRepository.updateDocument(id, patch)
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? updated : d)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    )
    return updated
  }, [])

  const deleteDocument = useCallback(async (id) => {
    await documentRepository.deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const duplicateDocument = useCallback(async (id) => {
    const duplicate = await documentRepository.duplicateDocument(id)
    setDocuments((prev) => [duplicate, ...prev])
    return duplicate
  }, [])

  return { documents, status, error, reload, createDocument, updateDocument, deleteDocument, duplicateDocument }
}
