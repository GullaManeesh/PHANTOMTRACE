import { useState, useEffect } from 'react'
import { apiJson } from '../utils/apiClient'

export function useThreatMap(threadId = 'all', timeFilter = '24h', customWindow = null) {
  const [locations, setLocations] = useState([])
  const [threats, setThreats] = useState([])
  const [threadScope, setThreadScope] = useState('single')
  const [windowStart, setWindowStart] = useState(null)
  const [windowEnd, setWindowEnd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchThreatMap = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          thread_id: threadId,
          time_filter: timeFilter,
        })

        if (customWindow?.startTime) {
          params.set('start_time', customWindow.startTime)
        }
        if (customWindow?.endTime) {
          params.set('end_time', customWindow.endTime)
        }

        const data = await apiJson(`/api/threat-map?${params.toString()}`)
        setLocations(data.locations || [])
        setThreats(data.threats || [])
        setThreadScope(data.thread_scope || 'single')
        setWindowStart(data.window_start || null)
        setWindowEnd(data.window_end || null)
      } catch (err) {
        console.error('Error fetching threat map:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchThreatMap()
  }, [threadId, timeFilter, customWindow?.startTime, customWindow?.endTime])

  return { locations, threats, threadScope, windowStart, windowEnd, loading, error }
}
