// ThreatSense — AlertDetail
// Full detailed view of a single alert
// Shows narrative, timeline, agent findings, MITRE techniques, actions

import { useParams, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, Sparkles, ExternalLink } from 'lucide-react'
import { SeverityBadge } from '../components/alerts/SeverityBadge'
import { formatToIST, timeAgo } from '../utils/helpers'
import { useEffect, useMemo, useState } from 'react'
import { apiJson } from '../utils/apiClient'

export default function AlertDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [alert, setAlert] = useState(location.state?.alert || null)
  const [loading, setLoading] = useState(!location.state?.alert)
  const [error, setError] = useState(null)
  const fromPath = location.state?.fromPath || '/reports'
  const [acknowledged, setAcknowledged] = useState(alert?.acknowledged || false)

  useEffect(() => {
    // Keep local acknowledge state in sync when alert changes after async fetch.
    setAcknowledged(Boolean(alert?.acknowledged))
  }, [alert])

  useEffect(() => {
    if (location.state?.alert?._id === id) {
      setAlert(location.state.alert)
      setError(null)
      setLoading(false)
      return
    }

    const fetchAlert = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await apiJson('/api/alerts?thread_id=all&limit=500')
        const foundAlert = (data.alerts || []).find((item) => item._id === id)
        if (!foundAlert) {
          setAlert(null)
          setError('Alert not found in MongoDB for this thread.')
          return
        }

        setAlert(foundAlert)
      } catch (err) {
        setAlert(null)
        setError(err.message || 'Unable to load alert details.')
      } finally {
        setLoading(false)
      }
    }

    fetchAlert()
  }, [id, location.state])

  const timeline = useMemo(() => {
    if (!alert?.timeline?.length) {
      return []
    }
    return alert.timeline
  }, [alert])

  const agentFindings = useMemo(() => {
    if (alert?.agent_findings && typeof alert.agent_findings === 'object') {
      return alert.agent_findings
    }

    const payload = alert?.event_payload || {}
    const findings = []
    if (payload.source_ip) findings.push(`Source IP: ${payload.source_ip}`)
    if (payload.user_id) findings.push(`User ID: ${payload.user_id}`)
    if (payload.destination_ip) findings.push(`Destination IP: ${payload.destination_ip}`)
    if (payload.process_name) findings.push(`Process: ${payload.process_name}`)
    if (payload.query) findings.push(`Query: ${payload.query}`)

    return {
      system_agent: {
        anomaly_flags: findings.length ? findings : ['event_detected'],
        confidence: Math.min(0.99, (alert?.severity_score || 5) / 10),
        source_ip: payload.source_ip,
        user_id: payload.user_id,
        process_name: payload.process_name,
        entity_id: payload.user_id || payload.source_ip,
      },
    }
  }, [alert])

  const mitreTechniques = alert?.mitre_techniques || []
  const recommendedActions = alert?.recommended_actions || []
  const affectedEntities = alert?.affected_entities || []

  if (loading) {
    return (
      <div className="card">
        <p className="text-brown-secondary">Loading alert details from MongoDB...</p>
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <p className="text-brown-secondary">{error || 'Alert not found'}</p>
        <Link to={fromPath} className="text-orange-DEFAULT hover:underline mt-4 inline-block">
          Back
        </Link>
      </div>
    )
  }

  const agentColors = {
    network_agent: { color: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'bg-blue-100' },
    auth_agent: { color: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', icon: 'bg-orange-100' },
    behavioral_agent: { color: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-800', icon: 'bg-teal-100' },
    system_agent: { color: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-800', icon: 'bg-slate-100' },
  }

  const agentNames = {
    network_agent: 'Network Anomaly Agent',
    auth_agent: 'Auth & Access Agent',
    behavioral_agent: 'Behavioral Analytics Agent',
    system_agent: 'Security Event System',
  }

  return (
    <div>
      {/* Back button */}
      <Link to={fromPath} className="flex items-center gap-2 text-orange-DEFAULT hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to alerts
      </Link>

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-orange-tint to-white border mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <code className="text-xs font-mono text-brown-secondary">ALERT-{alert._id}</code>
            <h1 className="text-4xl font-bold text-brown-primary mt-2">
              {alert.attack_classification}
            </h1>
          </div>
          <SeverityBadge label={alert.severity_label} size="lg" />
        </div>

        <div className="flex flex-wrap gap-6 text-sm mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-brown-secondary">Severity Score</p>
            <p className="font-bold text-2xl text-orange-DEFAULT">
              {alert.severity_score.toFixed(1)} / 10
            </p>
          </div>
          <div>
            <p className="text-brown-secondary">MITRE Techniques</p>
            <p className="font-bold text-lg text-brown-primary">
              {mitreTechniques.length} detected
            </p>
          </div>
          <div>
            <p className="text-brown-secondary">Created</p>
            <p className="font-medium text-brown-primary">
              {timeAgo(alert.created_at)}
            </p>
          </div>
          {acknowledged && (
            <div className="ml-auto text-green-600 flex items-center gap-1">
              <CheckCircle className="w-5 h-5" />
              Acknowledged
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card border-l-4 border-l-orange-DEFAULT mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-orange-DEFAULT" />
          <h3 className="font-semibold text-brown-primary">AI Analysis</h3>
          <span className="text-xs bg-orange-tint text-orange-DEFAULT px-2 py-0.5 rounded">
            Powered by Claude
          </span>
        </div>
        <p className="text-base leading-relaxed text-brown-primary">
          {alert.attack_narrative}
        </p>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mb-6"
      >
        <h3 className="font-semibold text-brown-primary mb-6">Event Timeline</h3>

        <div className="space-y-6">
          {timeline.map((event, idx) => (
            <div key={idx} className="relative flex gap-4">
              {/* Timeline line */}
              {idx < timeline.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border"></div>
              )}

              {/* Dot */}
              <div className="relative z-10">
                <div
                  className={`w-3 h-3 rounded-full mt-1.5 ${
                    event.agent_source.includes('Network')
                      ? 'bg-blue-500'
                      : event.agent_source.includes('Auth')
                      ? 'bg-orange-500'
                      : event.agent_source.includes('Behavior')
                      ? 'bg-teal-500'
                      : 'bg-slate-500'
                  }`}
                ></div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="font-mono text-xs text-brown-secondary mb-1">
                  {formatToIST(event.timestamp)}
                </p>
                <p className="text-sm font-medium text-brown-primary">
                  {event.event}
                </p>
                <span className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mt-2">
                  {event.agent_source}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Agent Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Agent Findings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(agentFindings).map(([agentKey, findings]) => {
            const colors = agentColors[agentKey] || agentColors.system_agent
            return (
              <div key={agentKey} className={`card border-t-4 ${colors.border}`}>
                <h4 className={`font-semibold text-sm ${colors.text} mb-3`}>
                  {agentNames[agentKey] || 'Security Agent'}
                </h4>

                {/* Confidence bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-brown-secondary">Confidence</p>
                    <p className="text-sm font-bold text-brown-primary">
                      {((findings.confidence || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-DEFAULT transition-all duration-300"
                      style={{ width: `${(findings.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Anomaly flags */}
                {(findings.anomaly_flags || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(findings.anomaly_flags || []).map((flag) => (
                      <span
                        key={flag}
                        className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-teal-600 text-xs mb-3">
                    <CheckCircle className="w-4 h-4" />
                    No anomalies detected
                  </div>
                )}

                {/* Key data */}
                {(findings.source_ip || findings.user_id || findings.process_name || findings.entity_id) && (
                  <div className="text-xs font-mono text-brown-secondary bg-beige px-2 py-1 rounded">
                    {findings.source_ip || findings.user_id || findings.process_name || findings.entity_id}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* MITRE Techniques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card mb-6"
      >
        <h3 className="font-semibold text-brown-primary mb-4">
          MITRE ATT&CK Techniques Detected
        </h3>

        {mitreTechniques.length === 0 ? (
          <p className="text-sm text-brown-secondary">No MITRE techniques mapped for this event.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-3">
              {mitreTechniques.map((technique) => (
              <a
                key={technique.id}
                href={technique.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card border-orange-300 border hover:border-orange-DEFAULT transition-colors flex-shrink-0 min-w-max group cursor-pointer"
              >
                <p className="font-mono text-sm font-bold text-orange-DEFAULT mb-1">
                  {technique.id}
                </p>
                <p className="text-sm font-medium text-brown-primary mb-2 group-hover:underline">
                  {technique.name}
                </p>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {technique.tactic}
                </span>
              </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Recommended Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card mb-6"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Recommended Actions</h3>

        {recommendedActions.length === 0 ? (
          <p className="text-sm text-brown-secondary">No recommended actions were generated for this event.</p>
        ) : (
          <ol className="space-y-3">
            {recommendedActions.map((action, idx) => (
            <li key={idx} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-orange-DEFAULT text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <p className="text-brown-primary text-sm mt-0.5">{action}</p>
            </li>
            ))}
          </ol>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4 justify-between items-center py-6 border-t border-border"
      >
        <div className="flex gap-2">
          {affectedEntities.map((entity) => (
            <span key={entity} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
              {entity}
            </span>
          ))}
        </div>

        <button
          onClick={() => setAcknowledged(!acknowledged)}
          className={`px-6 py-2 font-semibold rounded-lg transition-all ${
            acknowledged
              ? 'bg-green-50 text-green-600 border border-green-300'
              : 'bg-orange-DEFAULT text-white hover:bg-orange-hover'
          }`}
        >
          {acknowledged ? '✓ Acknowledged' : 'Acknowledge Alert'}
        </button>
      </motion.div>
    </div>
  )
}
