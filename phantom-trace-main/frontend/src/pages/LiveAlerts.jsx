import { motion } from 'framer-motion'
import { AlertCard } from '../components/alerts/AlertCard'
import { useAlerts } from '../hooks/useAlerts'

export default function LiveAlerts() {
  const { alerts, loading, error } = useAlerts('all')

  const sortedAlerts = [...(alerts || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Live Alerts</h1>
        <p className="text-brown-secondary text-sm mt-1">Real-time security alerts across all active detections</p>
      </div>

      {loading && (
        <div className="card">
          <p className="text-brown-secondary">Loading alerts...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card border border-red-200 bg-red-50">
          <p className="text-red-700 text-sm font-semibold">Error loading live alerts</p>
          <p className="text-red-600 text-xs mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {sortedAlerts.length === 0 ? (
            <div className="card">
              <p className="text-brown-secondary">No live alerts detected.</p>
            </div>
          ) : (
            sortedAlerts.map((alert, index) => (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <AlertCard alert={alert} fromPath="/live-alerts" />
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}