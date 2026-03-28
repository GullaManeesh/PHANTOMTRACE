// ThreatSense — AgentCard
// Individual agent status card showing findings, confidence, and activity

import { motion } from 'framer-motion'
import { timeAgo } from '../../utils/helpers'

export function AgentCard({ agent }) {
  const agentColors = {
    network_agent: { icon: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    auth_agent: { icon: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    malware_agent: { icon: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    behavioral_agent: { icon: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  }

  const colors = agentColors[agent.key] || agentColors.network_agent

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h4 className="font-semibold text-brown-primary text-sm flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center`}>
            <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
          </div>
          {agent.name}
        </h4>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            agent.status === 'processing'
              ? 'bg-orange-50 text-orange-600 animate-pulse'
              : agent.status === 'idle'
              ? 'bg-green-50 text-green-600'
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          {agent.status === 'processing' ? '🔄 Processing' : agent.status === 'idle' ? '✓ Idle' : agent.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border text-sm">
        <div>
          <p className="text-brown-secondary text-xs mb-1">Findings Today</p>
          <p className="font-bold text-orange-DEFAULT text-lg">{agent.findings_today}</p>
        </div>
        <div>
          <p className="text-brown-secondary text-xs mb-1">Avg Confidence</p>
          <p className="font-bold text-brown-primary text-lg">
            {(agent.avg_confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Top anomaly */}
      <div className="mb-3">
        <p className="text-xs text-brown-secondary mb-2">Top Anomaly Flag</p>
        <span className="text-xs bg-orange-tint text-orange-700 border border-orange-200 px-2 py-1 rounded inline-block">
          {agent.top_flag.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.avg_confidence * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-orange-DEFAULT"
          ></motion.div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex justify-between items-center text-xs text-brown-secondary border-t border-border pt-3">
        <span>Last active: {timeAgo(agent.last_active)}</span>
        <span className="font-mono">{agent.avg_processing_ms}ms avg</span>
      </div>
    </motion.div>
  )
}
