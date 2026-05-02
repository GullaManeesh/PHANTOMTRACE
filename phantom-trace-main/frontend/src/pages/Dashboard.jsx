// ThreatSense — Dashboard
// Main landing page after login
// Shows stats, alert feed, and charts
// Now fetches real data from MongoDB backend

import { motion } from 'framer-motion'
import { AlertTriangle, AlertOctagon, Activity, Cpu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAlerts } from '../hooks/useAlerts'
import { AlertFeed } from '../components/alerts/AlertFeed'
import { SeverityGauge } from '../components/charts/SeverityGauge'
import { AlertsOverTime } from '../components/charts/AlertsOverTime'
import { ThreatTypeBar } from '../components/charts/ThreatTypeBar'

export default function Dashboard() {
  const { client } = useAuth()
  
  // Fetch alerts from MongoDB backend
  const { alerts, loading, error, summary } = useAlerts('all')

  const counts = summary?.counts || { critical: 0, high: 0, medium: 0, low: 0 }
  const logsToday = summary?.logs_today || 0
  const activeAgents = summary?.agents_active || 0
  const knownAgents = 5
  const maxSeverityScore = alerts.reduce((maxScore, alert) => {
    const score = Number(alert?.severity_score || 0)
    return Math.max(maxScore, Number.isFinite(score) ? score : 0)
  }, 0)

  const now = new Date()
  const last24hStart = new Date(now.getTime() - (24 * 60 * 60 * 1000))
  const alertsByHourMap = {}
  for (let i = 23; i >= 0; i -= 1) {
    const slot = new Date(now.getTime() - (i * 60 * 60 * 1000))
    const key = `${slot.getHours().toString().padStart(2, '0')}:00`
    alertsByHourMap[key] = 0
  }

  alerts.forEach((alert) => {
    if (!alert?.created_at) {
      return
    }
    const createdAt = new Date(alert.created_at)
    if (Number.isNaN(createdAt.getTime()) || createdAt < last24hStart) {
      return
    }
    const hourKey = `${createdAt.getHours().toString().padStart(2, '0')}:00`
    if (Object.prototype.hasOwnProperty.call(alertsByHourMap, hourKey)) {
      alertsByHourMap[hourKey] += 1
    }
  })

  const alertsByHour = Object.entries(alertsByHourMap).map(([hour, count]) => ({
    hour,
    count,
  }))

  const alertTypeData = Array.isArray(summary?.alerts_by_type) ? summary.alerts_by_type : []

  const statCards = [
    {
      title: 'Critical Alerts',
      count: counts.critical || 0,
      icon: AlertTriangle,
      color: 'bg-red-100',
      textColor: 'text-red-600',
      trend: `${counts.critical > 0 ? '↑' : '↓'} ${Math.abs(counts.critical)} from yesterday`,
      trendColor: counts.critical > 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      title: 'High Alerts',
      count: counts.high || 0,
      icon: AlertOctagon,
      color: 'bg-orange-100',
      textColor: 'text-orange-600',
      trend: `${counts.high > 0 ? '↑' : '↓'} ${Math.abs(counts.high)} from yesterday`,
      trendColor: counts.high > 0 ? 'text-orange-600' : 'text-green-600',
    },
    {
      title: 'Logs Processed',
      count: logsToday ? logsToday.toLocaleString() : '0',
      icon: Activity,
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
      trend: `${logsToday} ingested today`,
      trendColor: 'text-blue-600',
    },
    {
      title: 'Agents Active',
      count: `${activeAgents}/${knownAgents}`,
      icon: Cpu,
      color: 'bg-green-100',
      textColor: 'text-green-600',
      trend: activeAgents === knownAgents ? 'All systems operational' : 'Waiting for agent telemetry',
      trendColor: activeAgents === knownAgents ? 'text-green-600' : 'text-amber-600',
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Dashboard</h1>
        <p className="text-brown-secondary text-sm mt-1">
          Welcome back, {client?.website_name}
        </p>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-brown-secondary font-medium mb-2">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.count}
                  </p>
                  <p className={`text-xs mt-2 ${stat.trendColor}`}>
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Middle row - Alert feed and gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Alert feed (3 columns) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <AlertFeed alerts={alerts} loading={loading} error={error} />
        </motion.div>

        {/* Right column - Gauge and chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <SeverityGauge maxSeverityScore={maxSeverityScore} />
          <AlertsOverTime data={alertsByHour} />
        </motion.div>
      </div>

      {/* Bottom row - Threat types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ThreatTypeBar data={alertTypeData} />
      </motion.div>
    </div>
  )
}
