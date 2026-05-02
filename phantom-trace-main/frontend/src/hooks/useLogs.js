// ThreatSense — useLogs Hook
// Fetches raw logs from MongoDB backend for LogExplorer

import { useState, useEffect } from 'react'
import { apiJson } from '../utils/apiClient'

export function useLogs(threadId = 'all') {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await apiJson(`/api/logs?thread_id=${threadId}&limit=100`)
        setLogs(data.logs || [])

      } catch (err) {
        console.error('Error fetching logs:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [threadId])

  return { logs, loading, error }
}
