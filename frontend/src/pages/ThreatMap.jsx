// ThreatSense — ThreatMap
// Geographic visualization of threat sources using react-simple-maps

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DUMMY_THREAT_MAP, DUMMY_ALERTS } from '../data/dummyData'
import { SeverityBadge } from '../components/alerts/SeverityBadge'
import { AlertCard } from '../components/alerts/AlertCard'
import { X } from 'lucide-react'

export default function ThreatMap() {
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [timeFilter, setTimeFilter] = useState('24h')

  // Note: Full react-simple-maps integration would go here
  // For now, we'll create a visual representation

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Threat Map</h1>
        <p className="text-brown-secondary text-sm mt-1">Geographic origin of threats</p>
      </div>

      {/* Time filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-3 mb-6"
      >
        {['1h', '6h', '24h', '7d'].map((time) => (
          <button
            key={time}
            onClick={() => setTimeFilter(time)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeFilter === time
                ? 'bg-orange-DEFAULT text-white'
                : 'bg-white border border-border text-brown-primary hover:bg-beige'
            }`}
          >
            {time}
          </button>
        ))}
      </motion.div>

      {/* Map card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-0 overflow-hidden rounded-card mb-6 h-80 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-brown-secondary text-lg font-semibold">World Threat Map</p>
          <p className="text-brown-secondary text-sm mt-2">Interactive map would load here</p>
          <div className="mt-6 space-y-2">
            {DUMMY_THREAT_MAP.map((loc) => (
              <motion.div
                key={loc.country}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedMarker(selectedMarker === loc.country ? null : loc.country)}
                className="px-4 py-2 bg-white rounded-lg border border-border cursor-pointer hover:border-orange-DEFAULT transition-colors inline-block mx-1"
              >
                <p className="text-xs font-semibold text-brown-primary">
                  {loc.country} ({loc.alert_count})
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats and marker details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-brown-secondary text-xs mb-1">Source Countries</p>
          <p className="text-3xl font-bold text-orange-DEFAULT">{DUMMY_THREAT_MAP.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <p className="text-brown-secondary text-xs mb-1">Total Flagged IPs</p>
          <p className="text-3xl font-bold text-orange-DEFAULT">
            {DUMMY_THREAT_MAP.reduce((sum, loc) => sum + loc.alert_count * 3, 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card col-span-2"
        >
          <p className="text-brown-secondary text-xs mb-1">Most Active Origin</p>
          <p className="text-lg font-bold text-orange-DEFAULT">
            Russia (2 alerts)
          </p>
        </motion.div>
      </div>

      {/* Threat locations detail panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <h3 className="font-semibold text-brown-primary mb-4">Threat Locations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DUMMY_THREAT_MAP.map((location) => (
            <motion.div
              key={location.country}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedMarker(selectedMarker === location.country ? null : location.country)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-brown-primary text-lg">
                    {location.country}
                  </h4>
                  <p className="text-sm text-brown-secondary">{location.city}</p>
                </div>
                <SeverityBadge label={location.top_severity} />
              </div>
              <p className="text-sm text-brown-primary">
                <span className="font-semibold text-orange-DEFAULT">{location.alert_count}</span> alerts
              </p>

              {/* Expandable details */}
              {selectedMarker === location.country && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  <p className="text-xs text-brown-secondary mb-3 font-semibold">Related Alerts:</p>
                  {DUMMY_ALERTS.slice(0, 2).map((alert) => (
                    <div
                      key={alert._id}
                      className="text-xs text-brown-primary mb-2 p-2 bg-beige rounded"
                    >
                      {alert.attack_classification}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
