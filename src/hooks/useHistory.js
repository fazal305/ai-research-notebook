import { useCallback, useEffect, useState } from 'react'
import * as historyRepository from '../services/storage/historyRepository.js'

export function useHistory() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const list = await historyRepository.listHistory()
      setEntries(list)
      setStatus('ready')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const deleteEntry = useCallback(async (id) => {
    await historyRepository.deleteHistoryEntry(id)
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const clearAll = useCallback(async () => {
    await historyRepository.clearHistory()
    setEntries([])
  }, [])

  return { entries, status, error, reload, deleteEntry, clearAll }
}
