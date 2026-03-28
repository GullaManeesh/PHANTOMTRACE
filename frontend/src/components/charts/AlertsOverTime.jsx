// ThreatSense — AlertsOverTime
// Bar chart showing alert count by hour over last 24h
// Uses Recharts

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { DUMMY_STATS } from '../../data/dummyData'

export function AlertsOverTime() {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      return (
        <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-brown-primary">
            {payload[0].payload.hour}
          </p>
          <p className="text-sm text-orange-DEFAULT font-bold">
            {payload[0].value} alerts
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-brown-primary mb-4">Alerts (Last 24 Hours)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={DUMMY_STATS.alerts_by_hour}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12, fill: '#6B5B4E' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B5B4E' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill="#E8631A"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
