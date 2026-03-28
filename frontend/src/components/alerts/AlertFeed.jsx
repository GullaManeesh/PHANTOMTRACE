// ThreatSense — AlertFeed
// Shows live alert feed as a scrollable list of compact AlertCards

import { motion } from 'framer-motion'
import { AlertTriangle, Zap } from 'lucide-react'
import { AlertCard } from './AlertCard'
import { DUMMY_ALERTS } from '../../data/dummyData'

export function AlertFeed() {
  // Sort by created_at descending
  const sorted = [...DUMMY_ALERTS].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="font-semibold text-brown-primary">Live Alert Feed</h3>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-xs text-green-600 font-semibold flex items-center gap-1"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </motion.div>
      </div>

      {/* Alert list */}
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

      {/* Footer */}
      <div className="text-xs text-brown-secondary mt-4 pt-4 border-t border-border">
        Showing {sorted.length} alerts
      </div>
    </div>
  )
}
