// ThreatSense — AgentMonitor
// Real-time pipeline and agent status dashboard

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAgents } from '../hooks/useAgents'
import { AgentPipeline } from '../components/agents/AgentPipeline'
import { AgentCard } from '../components/agents/AgentCard'
import { timeAgo } from '../utils/helpers'

export default function AgentMonitor() {
  const { agents, overview, pipeline, loading, error } = useAgents('all')
  const [findingFilter, setFindingFilter] = useState('All')

  const findingTabs = ['All', 'Network', 'Auth', 'Behavioural', 'Orchestrator', 'Explainer']
  const processingAgent = agents.find((agent) => agent.status === 'processing')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Agent Monitor</h1>
        <p className="text-brown-secondary text-sm mt-1">Real-time agent pipeline status</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-DEFAULT rounded-full animate-spin mb-3"></div>
            <p className="text-brown-secondary">Loading agents...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="text-sm font-semibold">Error loading agents</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="card">
              <p className="text-brown-secondary text-xs mb-1">Active Agents</p>
              <p className="text-2xl font-bold text-brown-primary">{overview?.active_agents ?? 0}</p>
            </div>
            <div className="card">
              <p className="text-brown-secondary text-xs mb-1">Processing Now</p>
              <p className="text-2xl font-bold text-orange-DEFAULT">{overview?.processing_agents ?? 0}</p>
            </div>
            <div className="card">
              <p className="text-brown-secondary text-xs mb-1">Findings Today</p>
              <p className="text-2xl font-bold text-brown-primary">{overview?.total_findings_today ?? 0}</p>
            </div>
            <div className="card">
              <p className="text-brown-secondary text-xs mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-brown-primary">
                {Math.round((overview?.avg_confidence ?? 0) * 100)}%
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AgentPipeline agents={agents} pipeline={pipeline} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-sm text-brown-secondary"
          >
            {processingAgent
              ? `${processingAgent.name} is currently processing live telemetry.`
              : `Pipeline is idle. Last update: ${overview?.last_pipeline_update ? timeAgo(overview.last_pipeline_update) : 'never'}.`}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="font-semibold text-brown-primary mb-4">Agent Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent, idx) => (
                <motion.div
                  key={agent.key || agent.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <AgentCard agent={agent} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8"
          >
            <h3 className="font-semibold text-brown-primary mb-4">Recent Findings</h3>
            <div className="card">
              <div className="flex gap-4 mb-4 pb-4 border-b border-border overflow-x-auto">
                {findingTabs.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFindingFilter(filter)}
                    className={`text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === findingFilter
                        ? 'text-orange-DEFAULT border-b-2 border-b-orange-DEFAULT'
                        : 'text-brown-secondary hover:text-brown-primary'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {agents
                  .filter((agent) => findingFilter === 'All' || agent.name.toLowerCase().includes(findingFilter.toLowerCase()))
                  .flatMap((agent) =>
                    (agent.recent_findings || []).slice(0, 2).map((finding, idx) => ({
                      agent,
                      finding,
                      idx,
                    }))
                  )
                  .map(({ agent, finding, idx }) => (
                    <div
                      key={`${agent.key || agent.name}-${idx}`}
                      className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 font-semibold shrink-0">
                          {agent.key || agent.name}
                        </span>
                        <span className="text-sm text-brown-primary truncate">
                          {finding.finding || 'No summary available'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono text-brown-secondary">
                          {(Math.max(0, Number(agent.avg_confidence || 0)) * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-brown-secondary">{agent.status}</span>
                      </div>
                    </div>
                  ))}

                {agents
                  .filter((agent) => findingFilter === 'All' || agent.name.toLowerCase().includes(findingFilter.toLowerCase()))
                  .every((agent) => (agent.recent_findings || []).length === 0) && (
                  <p className="text-sm text-brown-secondary py-3">No recent findings for the selected filter.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
