// ThreatSense — useAlerts Hook
// Fetches alerts from MongoDB backend and provides loading/error states

import { useState, useEffect } from 'react'
import { apiJson } from '../utils/apiClient'

export function useAlerts(threadId = 'all') {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const fetchAlertsAndSummary = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch alerts
        const alertsData = await apiJson(`/api/alerts?thread_id=${threadId}&limit=50`)
        setAlerts(alertsData.alerts || [])

        // Fetch summary
        const summaryData = await apiJson(`/api/alerts/summary?thread_id=${threadId}`)
        setSummary(summaryData)

      } catch (err) {
        console.error('Error fetching alerts:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAlertsAndSummary()
  }, [threadId])

  return { alerts, loading, error, summary }
}
