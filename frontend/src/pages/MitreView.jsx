// ThreatSense — MitreView
// MITRE ATT&CK framework visualization

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MITRE_TECHNIQUES, DUMMY_ALERTS } from '../data/dummyData'
import { ExternalLink } from 'lucide-react'

export default function MitreView() {
  const [selectedTechnique, setSelectedTechnique] = useState(null)

  // Group techniques by tactic
  const tacticMap = {}
  MITRE_TECHNIQUES.forEach((tech) => {
    if (!tacticMap[tech.tactic]) {
      tacticMap[tech.tactic] = []
    }
    tacticMap[tech.tactic].push(tech)
  })

  const tactics = Object.keys(tacticMap).sort()
  const detectedCount = MITRE_TECHNIQUES.filter(t => t.detected).length
  const detectedTactics = new Set(
    MITRE_TECHNIQUES.filter(t => t.detected).map(t => t.tactic)
  ).size

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">MITRE ATT&CK</h1>
        <p className="text-brown-secondary text-sm mt-1">
          Techniques detected in your environment
        </p>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-6 mb-8 flex-wrap"
      >
        <div className="card flex-1 min-w-max">
          <p className="text-brown-secondary text-xs mb-1">Techniques Detected</p>
          <p className="text-3xl font-bold text-orange-DEFAULT">{detectedCount}</p>
        </div>
        <div className="card flex-1 min-w-max">
          <p className="text-brown-secondary text-xs mb-1">Tactics Affected</p>
          <p className="text-3xl font-bold text-orange-DEFAULT">{detectedTactics}</p>
        </div>
        <div className="card flex-1 min-w-max">
          <p className="text-brown-secondary text-xs mb-1">Most Active Tactic</p>
          <p className="text-lg font-bold text-brown-primary">Credential Access</p>
        </div>
      </motion.div>

      {/* MITRE Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-x-auto"
      >
        <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${tactics.length}, minmax(200px, 1fr))` }}>
          {/* Tactic headers */}
          {tactics.map((tactic, idx) => (
            <motion.div
              key={tactic}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-sidebar text-cream font-semibold text-sm p-3 text-center border-r border-border sticky top-0"
            >
              {tactic}
            </motion.div>
          ))}

          {/* Techniques */}
          {tactics.map((tactic, tacticIdx) => (
            <div key={`col-${tactic}`} className="border-r border-border">
              {tacticMap[tactic].map((technique, techIdx) => (
                <motion.button
                  key={technique.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: tacticIdx * 0.05 + techIdx * 0.02 }}
                  onClick={() => setSelectedTechnique(
                    selectedTechnique?.id === technique.id ? null : technique
                  )}
                  className={`w-full p-3 text-left border-b border-border transition-all hover:bg-orange-50 ${
                    technique.detected
                      ? 'bg-orange-50 border-orange-300 cursor-pointer'
                      : 'bg-gray-50 opacity-60 cursor-default'
                  }`}
                >
                  <p className="font-mono text-xs font-bold text-orange-DEFAULT mb-1">
                    {technique.id}
                  </p>
                  <p className={`text-xs font-medium leading-tight ${
                    technique.detected ? 'text-brown-primary' : 'text-gray-500'
                  }`}>
                    {technique.name}
                  </p>
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Technique details popover - when selected */}
      {selectedTechnique && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-6 border-l-4 border-l-orange-DEFAULT"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-sm font-bold text-orange-DEFAULT mb-1">
                {selectedTechnique.id}
              </p>
              <h3 className="text-xl font-semibold text-brown-primary">
                {selectedTechnique.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedTechnique(null)}
              className="text-brown-secondary hover:text-brown-primary"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-brown-secondary mb-4">
            Tactic: <span className="font-semibold text-brown-primary">{selectedTechnique.tactic}</span>
          </p>

          {selectedTechnique.detected && selectedTechnique.alert_ids.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-brown-primary mb-2">Triggered by:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTechnique.alert_ids.map((alertId) => (
                  <a
                    key={alertId}
                    href={`/alerts/${alertId}`}
                    className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded hover:bg-orange-100 transition-colors"
                  >
                    {alertId}
                  </a>
                ))}
              </div>
            </div>
          )}

          <a
            href={`https://attack.mitre.org/techniques/${selectedTechnique.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-DEFAULT font-semibold hover:underline"
          >
            View on MITRE <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      )}
    </div>
  )
}
