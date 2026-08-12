import { useEffect, useRef, useState } from 'react'

let requestCounter = 0

// A single computeStats round trip should never realistically take this
// long. If it does — a worker that silently failed to boot, a dropped
// message, whatever — surface an error instead of spinning forever.
const STALL_TIMEOUT_MS = 20000

/**
 * Computes text statistics for `text` in a Web Worker (see
 * workers/textWorker.js) instead of the main thread. One worker is created
 * per hook instance and terminated on unmount — cheap enough per document
 * selection, and it means a stalled/large computation can't leak.
 */
export function useTextStats(text) {
  const workerRef = useRef(null)
  const latestRequestId = useRef(null)
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'processing' | 'ready' | 'error'
  const [error, setError] = useState(null)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/textWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event) => {
      const { id, type, stats: resultStats, error: workerError } = event.data
      if (id !== latestRequestId.current) return // superseded by a newer request

      if (type === 'computeStats:success') {
        setStats(resultStats)
        setStatus('ready')
      } else if (type === 'computeStats:error') {
        setError(workerError)
        setStatus('error')
      }
    }

    worker.onerror = () => {
      setError('The text-processing worker crashed.')
      setStatus('error')
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!workerRef.current) return

    if (text == null) {
      setStats(null)
      setStatus('idle')
      return
    }

    const id = ++requestCounter
    latestRequestId.current = id
    setStatus('processing')
    setError(null)
    workerRef.current.postMessage({ id, type: 'computeStats', payload: { text } })

    const timeoutId = setTimeout(() => {
      if (id !== latestRequestId.current) return
      latestRequestId.current = null // ignore a late response if one arrives after all
      setError('Text analysis timed out. Try again.')
      setStatus('error')
    }, STALL_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [text])

  return { stats, status, error }
}
