import { useState, useEffect } from 'react'
import { apiJson } from '../utils/apiClient'

export function useAgents(threadId = 'all') {
  const [agents, setAgents] = useState([])
  const [overview, setOverview] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiJson(`/api/agents?thread_id=${threadId}`)
        setAgents(data.agents || [])
        setOverview(data.overview || null)
        setPipeline(data.pipeline || null)
      } catch (err) {
        console.error('Error fetching agents:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()

    const intervalId = setInterval(() => {
      fetchAgents()
    }, 15000)

    return () => clearInterval(intervalId)
  }, [threadId])

  return { agents, overview, pipeline, loading, error }
}
