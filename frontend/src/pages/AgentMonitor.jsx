// ThreatSense — AgentMonitor
// Real-time pipeline and agent status dashboard

import { motion } from 'framer-motion'
import { DUMMY_AGENT_STATUS } from '../data/dummyData'
import { AgentPipeline } from '../components/agents/AgentPipeline'
import { AgentCard } from '../components/agents/AgentCard'

export default function AgentMonitor() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Agent Monitor</h1>
        <p className="text-brown-secondary text-sm mt-1">Real-time agent pipeline status</p>
      </div>

      {/* Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AgentPipeline />
      </motion.div>

      {/* Agent cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-semibold text-brown-primary mb-4">Agent Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DUMMY_AGENT_STATUS.map((agent, idx) => (
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Recent Findings</h3>
        <div className="card">
          <div className="flex gap-4 mb-4 pb-4 border-b border-border">
            {['All', 'Network', 'Auth', 'Malware', 'Behavioral'].map((filter) => (
              <button
                key={filter}
                className={`text-sm font-medium transition-colors ${
                  filter === 'All'
                    ? 'text-orange-DEFAULT border-b-2 border-b-orange-DEFAULT'
                    : 'text-brown-secondary hover:text-brown-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sample findings table */}
          <div className="space-y-3">
            {DUMMY_AGENT_STATUS.map((agent) => (
              <div key={agent.key} className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 font-semibold">
                    {agent.name.split(' ')[0]}
                  </span>
                  <span className="text-sm text-brown-primary">{agent.top_flag.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-brown-secondary">
                    {(agent.avg_confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-brown-secondary">2 min ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
