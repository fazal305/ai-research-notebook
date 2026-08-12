import { useCallback, useEffect, useState } from 'react'
import { getDB } from '../services/storage/database.js'

/**
 * Tracks whether the shared IndexedDB connection is ready. Used once, at
 * the app root, to gate rendering: everything below it can assume the
 * database is available rather than each feature re-checking.
 */
export function useIndexedDB() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)

    getDB()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { status, error, retry }
}
