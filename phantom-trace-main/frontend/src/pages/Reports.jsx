// ThreatSense — Reports
// Weekly security summary with charts and tables

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { SeverityBadge } from '../components/alerts/SeverityBadge'
import { AlertCard } from '../components/alerts/AlertCard'
import { apiJson } from '../utils/apiClient'
import { timeAgo } from '../utils/helpers'

export default function Reports() {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiJson('/api/reports?thread_id=all')
        setReportData(data)
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const summaryCards = useMemo(() => {
    const summary = reportData?.summary || {}
    const totalAlerts = summary.total_alerts || 0
    const avgSeverity = Number(summary.avg_severity || 0)
    const highOrCritical = summary.high_or_critical || 0

    return [
      { label: 'Total Alerts', value: totalAlerts, color: 'text-orange-DEFAULT' },
      { label: 'Critical Incidents', value: summary.critical_incidents || 0, color: 'text-red-600' },
      { label: 'Avg Severity', value: `${avgSeverity.toFixed(1)}/10`, color: 'text-orange-DEFAULT' },
      { label: 'High + Critical', value: `${highOrCritical}/${totalAlerts}`, color: 'text-green-600' },
    ]
  }, [reportData])

  const severityData = [
    { name: 'Critical', value: reportData?.severity?.critical || 0, fill: '#DC2626' },
    { name: 'High', value: reportData?.severity?.high || 0, fill: '#EA580C' },
    { name: 'Medium', value: reportData?.severity?.medium || 0, fill: '#D97706' },
    { name: 'Low', value: reportData?.severity?.low || 0, fill: '#0D9488' },
  ]

  const topUsers = reportData?.top_users || []
  const topIPs = reportData?.top_ips || []
  const criticalAlerts = reportData?.top_critical_alerts || []
  const alertTypes = reportData?.alert_types || []

  const agentPerformanceData = (reportData?.agent_performance || []).map(agent => ({
    name: agent.name.replace(' Agent', ''),
    findings: agent.findings,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      return (
        <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-brown-primary">{payload[0].name}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].fill }}>
            {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="card">
        <p className="text-brown-secondary">Loading report data from MongoDB...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">Failed to load reports</p>
        </div>
        <p className="text-sm text-brown-secondary mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Reports</h1>
        <p className="text-brown-secondary text-sm mt-1">
          Weekly security summary for {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card"
          >
            <p className="text-brown-secondary text-xs mb-2">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Pie chart */}
        <div className="card">
          <h3 className="font-semibold text-brown-primary mb-4">Alerts by Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            {severityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                ></div>
                <span className="text-brown-primary">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="card">
          <h3 className="font-semibold text-brown-primary mb-4">Alert Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={alertTypes}
              layout="vertical"
              margin={{ left: 150 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6B5B4E' }} />
              <YAxis
                dataKey="type"
                type="category"
                tick={{ fontSize: 11, fill: '#6B5B4E' }}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#E8631A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Top Critical Alerts This Week</h3>
        <div className="space-y-4">
          {criticalAlerts.length === 0 && (
            <p className="text-sm text-brown-secondary">No threat events found for this thread.</p>
          )}
          {criticalAlerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} compact={false} fromPath="/reports" />
          ))}
        </div>
      </motion.div>

      {/* Tables row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Most targeted users */}
        <div className="card">
          <h3 className="font-semibold text-brown-primary mb-1">Most Flagged User IDs</h3>
          <p className="text-xs text-brown-secondary mb-3">
            Ranked by MongoDB threat events containing user_id for this thread.
          </p>
          <div className="divide-y divide-border">
            {topUsers.length === 0 && <p className="py-3 text-sm text-brown-secondary">No user-linked threat events found.</p>}
            {topUsers.map((user) => (
              <div key={user.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-brown-primary">{user.id}</p>
                  <p className="text-xs text-brown-secondary">{timeAgo(user.lastSeen)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-orange-DEFAULT">{user.alerts}</span>
                  <SeverityBadge label={user.risk} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top source IPs */}
        <div className="card">
          <h3 className="font-semibold text-brown-primary mb-4">Top Source IPs</h3>
          <div className="divide-y divide-border">
            {topIPs.length === 0 && <p className="py-3 text-sm text-brown-secondary">No source IP data found.</p>}
            {topIPs.map((ip) => (
              <div key={ip.ip} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-brown-primary">{ip.ip}</p>
                  <p className="text-xs text-brown-secondary">{ip.country}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-orange-DEFAULT">{ip.alerts}</span>
                  <SeverityBadge label={ip.severity} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Agent performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Agent Performance This Week</h3>
        {agentPerformanceData.length === 0 ? (
          <p className="text-sm text-brown-secondary">No agent findings available for this thread.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={agentPerformanceData}>
              <PolarGrid stroke="#EDE8E0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B5B4E' }} />
              <PolarRadiusAxis tick={{ fontSize: 12, fill: '#6B5B4E' }} />
              <Radar name="Findings" dataKey="findings" stroke="#E8631A" fill="#E8631A" fillOpacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EDE8E0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  )
}
