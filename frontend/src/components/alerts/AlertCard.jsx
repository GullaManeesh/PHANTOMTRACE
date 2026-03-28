// ThreatSense — AlertCard
// Display a single alert
// compact=false: full card with all details
// compact=true: horizontal row for lists

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { SeverityBadge } from './SeverityBadge'
import { timeAgo, severityBorderClass } from '../../utils/helpers'
import clsx from 'clsx'

export function AlertCard({ alert, compact = false }) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="py-3 px-4 border-b border-border hover:bg-orange-tint cursor-pointer transition-colors"
      >
        <Link to={`/alerts/${alert._id}`}>
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Severity dot */}
              <div
                className={clsx(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  alert.severity_label === 'CRITICAL' && 'bg-red-500',
                  alert.severity_label === 'HIGH' && 'bg-orange-500',
                  alert.severity_label === 'MEDIUM' && 'bg-amber-500',
                  alert.severity_label === 'LOW' && 'bg-teal-500'
                )}
              ></div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brown-primary text-sm truncate">
                  {alert.attack_classification}
                </p>
                <p className="text-xs text-brown-secondary truncate">
                  {alert.affected_entities[0] || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-3">
              <SeverityBadge label={alert.severity_label} size="sm" />
              <span className="text-xs text-brown-secondary whitespace-nowrap">
                {timeAgo(alert.created_at)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // Full card layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'card relative transition-all duration-150 hover:shadow-md hover:scale-[1.01] mb-3',
        severityBorderClass(alert.severity_label)
      )}
    >
      {/* Acknowledged badge */}
      {alert.acknowledged && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3" />
            Acknowledged
          </div>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="font-mono text-xs text-brown-secondary">{alert._id}</span>
          <h3 className="font-semibold text-lg text-brown-primary mt-1">
            {alert.attack_classification}
          </h3>
        </div>
        <SeverityBadge label={alert.severity_label} size="md" />
      </div>

      {/* Entities */}
      <div className="flex gap-2 flex-wrap mb-4">
        {alert.affected_entities.map((entity) => (
          <span key={entity} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {entity}
          </span>
        ))}
      </div>

      {/* Score and time */}
      <div className="flex items-center justify-between text-sm">
        <div className="font-mono text-brown-secondary">
          Score: <span className="font-bold text-orange-DEFAULT">{alert.severity_score.toFixed(1)}/10</span>
        </div>
        <Link
          to={`/alerts/${alert._id}`}
          className="text-orange-DEFAULT font-semibold hover:underline flex items-center gap-1"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  )
}
