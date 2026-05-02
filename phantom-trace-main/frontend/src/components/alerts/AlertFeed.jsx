// ThreatSense — AlertFeed
// Shows live alert feed as a scrollable list of compact AlertCards

import { AlertTriangle, Zap, Lock } from 'lucide-react'
import { AlertCard } from './AlertCard'

export function AlertFeed({ alerts = [], loading = false, error = null }) {
  // Sort by created_at descending
  const sorted = [...(alerts || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="font-semibold text-brown-primary">Live Alert Feed</h3>
        {!loading && (
          <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></span>
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="animate-spin mb-3">
            <AlertTriangle className="w-8 h-8 text-brown-secondary opacity-50" />
          </div>
          <p className="text-brown-secondary text-sm">Loading alerts...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Lock className="w-8 h-8 text-red-500 mb-2 opacity-50" />
          <p className="text-red-600 text-sm font-medium">Error loading alerts</p>
          <p className="text-brown-secondary text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Alert list */}
      {!loading && !error && (
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-8 h-8 text-brown-secondary mb-2 opacity-50" />
              <p className="text-brown-secondary text-sm">No alerts detected</p>
            </div>
          ) : (
            sorted.map((alert) => (
              <AlertCard key={alert._id} alert={alert} compact={true} />
            ))
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className="text-xs text-brown-secondary mt-4 pt-4 border-t border-border">
          Showing {sorted.length} {sorted.length === 1 ? 'alert' : 'alerts'}
        </div>
      )}
    </div>
  )
}
