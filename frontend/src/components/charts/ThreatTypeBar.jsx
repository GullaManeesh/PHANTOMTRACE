// ThreatSense — ThreatTypeBar
// Horizontal bar chart showing alerts by attack type

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DUMMY_STATS } from '../../data/dummyData'

export function ThreatTypeBar() {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      return (
        <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-brown-primary">
            {payload[0].payload.type}
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
      <h3 className="font-semibold text-brown-primary mb-4">Alert Types Today</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={DUMMY_STATS.alerts_by_type}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6B5B4E' }} axisLine={false} />
          <YAxis
            dataKey="type"
            type="category"
            tick={{ fontSize: 12, fill: '#6B5B4E' }}
            axisLine={false}
            tickLine={false}
            width={180}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill="#E8631A"
            radius={[0, 4, 4, 0]}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
