// ThreatSense — Reports
// Weekly security summary with charts and tables

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { AlertTriangle, Shield, TrendingUp, CheckCircle } from 'lucide-react'
import { DUMMY_STATS, DUMMY_ALERTS, DUMMY_AGENT_STATUS } from '../data/dummyData'
import { SeverityBadge } from '../components/alerts/SeverityBadge'
import { AlertCard } from '../components/alerts/AlertCard'

export default function Reports() {
  const summaryCards = [
    { label: 'Total Alerts', value: DUMMY_ALERTS.length, color: 'text-orange-DEFAULT' },
    { label: 'Critical Incidents', value: DUMMY_STATS.counts.critical, color: 'text-red-600' },
    { label: 'Avg Severity', value: '6.1', color: 'text-orange-DEFAULT' },
    { label: 'Resolved', value: `${DUMMY_ALERTS.filter(a => a.acknowledged).length}/${DUMMY_ALERTS.length}`, color: 'text-green-600' },
  ]

  const severityData = [
    { name: 'Critical', value: DUMMY_STATS.counts.critical, fill: '#DC2626' },
    { name: 'High', value: DUMMY_STATS.counts.high, fill: '#EA580C' },
    { name: 'Medium', value: DUMMY_STATS.counts.medium, fill: '#D97706' },
    { name: 'Low', value: DUMMY_STATS.counts.low, fill: '#0D9488' },
  ]

  const topUsers = [
    { id: 'user_42', alerts: 2, lastSeen: '2h ago', risk: 'CRITICAL' },
    { id: 'user_15', alerts: 1, lastSeen: '11h ago', risk: 'MEDIUM' },
    { id: 'user_33', alerts: 1, lastSeen: '15h ago', risk: 'LOW' },
  ]

  const topIPs = [
    { ip: '185.220.101.45', country: 'Russia', alerts: 2, severity: 'CRITICAL' },
    { ip: '45.142.212.100', country: 'Ukraine', alerts: 1, severity: 'MEDIUM' },
    { ip: '194.165.16.15', country: 'Germany', alerts: 1, severity: 'HIGH' },
  ]

  const agentPerformanceData = DUMMY_AGENT_STATUS.map(agent => ({
    name: agent.name.split(' ')[0],
    findings: agent.findings_today,
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
              data={DUMMY_STATS.alerts_by_type}
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
          {DUMMY_ALERTS.slice(0, 2).map((alert) => (
            <AlertCard key={alert._id} alert={alert} compact={false} />
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
          <h3 className="font-semibold text-brown-primary mb-4">Most Targeted Users</h3>
          <div className="divide-y divide-border">
            {topUsers.map((user, idx) => (
              <div key={user.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-brown-primary">{user.id}</p>
                  <p className="text-xs text-brown-secondary">{user.lastSeen}</p>
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
            {topIPs.map((ip, idx) => (
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
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={agentPerformanceData}>
            <PolarGrid stroke="#EDE8E0" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B5B4E' }} />
            <PolarRadiusAxis tick={{ fontSize: 12, fill: '#6B5B4E' }} />
            <Radar name="Findings Today" dataKey="findings" stroke="#E8631A" fill="#E8631A" fillOpacity={0.6} />
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
      </motion.div>
    </div>
  )
}
