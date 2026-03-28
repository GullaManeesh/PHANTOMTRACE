// ThreatSense — SeverityGauge
// Semicircular arc gauge showing current maximum severity score
// Uses SVG for the gauge visualization

import { DUMMY_STATS, DUMMY_ALERTS } from '../../data/dummyData'

export function SeverityGauge() {
  // Find max severity score
  const maxSeverity = Math.max(...DUMMY_ALERTS.map(a => a.severity_score))
  const percentage = (maxSeverity / 10) * 100

  // Determine color based on severity
  let gaugeColor = '#0D9488' // LOW - teal
  let labelColor = 'text-teal-600'
  let label = 'LOW'

  if (maxSeverity >= 8) {
    gaugeColor = '#DC2626' // CRITICAL - red
    labelColor = 'text-red-600'
    label = 'CRITICAL'
  } else if (maxSeverity >= 6) {
    gaugeColor = '#EA580C' // HIGH - orange
    labelColor = 'text-orange-600'
    label = 'HIGH'
  } else if (maxSeverity >= 4) {
    gaugeColor = '#D97706' // MEDIUM - amber
    labelColor = 'text-amber-600'
    label = 'MEDIUM'
  }

  const circumference = Math.PI * 100
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="card">
      <h3 className="font-semibold text-brown-primary mb-6">Current Threat Level</h3>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 120 70" className="w-full h-auto" style={{ maxWidth: '200px' }}>
          {/* Background arc (light gray) */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke="#EDE8E0"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Colored arc (gauge fill) */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Score display */}
        <div className="text-center mt-4">
          <div className={`text-4xl font-bold ${labelColor}`}>
            {maxSeverity.toFixed(1)}
          </div>
          <p className="text-sm text-brown-secondary mt-1">/ 10</p>
          <p className={`text-sm font-semibold mt-3 ${labelColor}`}>
            {label} THREAT LEVEL
          </p>
        </div>
      </div>
    </div>
  )
}
