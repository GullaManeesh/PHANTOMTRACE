// ThreatSense — LogExplorer
// Raw logs explorer with filtering and search
// Now fetches real logs from MongoDB backend

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLogs } from '../hooks/useLogs'
import { formatToIST, truncate } from '../utils/helpers'
import { Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

function logTypeColors(logType) {
  const colors = {
    auth: { bg: 'bg-red-50', text: 'text-red-700' },
    network: { bg: 'bg-blue-50', text: 'text-blue-700' },
    process: { bg: 'bg-purple-50', text: 'text-purple-700' },
    dns: { bg: 'bg-amber-50', text: 'text-amber-700' },
    behavioral: { bg: 'bg-green-50', text: 'text-green-700' },
  }
  return colors[logType] || { bg: 'bg-gray-50', text: 'text-gray-700' }
}

export default function LogExplorer() {
  const [logTypeFilter, setLogTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)

  // Fetch logs from MongoDB
  const { logs, loading, error } = useLogs('all')

  const logTypes = ['all', 'auth', 'network', 'process', 'dns', 'behavioral']
  const statuses = ['all', 'flagged', 'normal', 'success', 'failure']

  // Filter logs - use useMemo to optimize
  const filtered = useMemo(() => {
    let result = logs
    if (logTypeFilter !== 'all') {
      result = result.filter(l => l.log_type === logTypeFilter)
    }
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter)
    }
    if (searchTerm) {
      result = result.filter(l =>
        (l.source_ip && l.source_ip.includes(searchTerm)) ||
        (l.user_id && l.user_id.includes(searchTerm)) ||
        (l.log_type && l.log_type.includes(searchTerm))
      )
    }
    return result
  }, [logs, logTypeFilter, statusFilter, searchTerm])

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Log Explorer</h1>
        <p className="text-brown-secondary text-sm mt-1">Raw logs from your security infrastructure</p>
      </div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 flex flex-col md:flex-row gap-4 flex-wrap items-center"
      >
        {/* Log type select */}
        <select
          value={logTypeFilter}
          onChange={(e) => setLogTypeFilter(e.target.value)}
          className="px-3 py-2 bg-beige border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
          disabled={loading}
        >
          {logTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Log Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Status select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-beige border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
          disabled={loading}
        >
          {statuses.map(status => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 md:min-w-[300px]">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-brown-secondary" />
          <input
            type="text"
            placeholder="Search IP, user, command..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT disabled:opacity-50"
          />
        </div>

        {/* Live indicator - right aligned */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm text-orange-DEFAULT font-semibold ml-auto">
            <span className="w-2 h-2 rounded-full bg-orange-DEFAULT animate-pulse"></span>
            Live
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        {/* Loading state */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="animate-spin mb-3">
              <AlertTriangle className="w-8 h-8 text-brown-secondary opacity-50" />
            </div>
            <p className="text-brown-secondary text-sm">Loading logs...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-2 opacity-50" />
            <p className="text-red-600 text-sm font-medium">Error loading logs</p>
            <p className="text-brown-secondary text-xs mt-1">{error}</p>
          </div>
        )}

        {/* Table content */}
        {!loading && !error && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 pb-3 mb-3 border-b border-border font-semibold text-sm text-brown-primary">
              <div>Timestamp</div>
              <div>Log Type</div>
              <div>Source IP</div>
              <div>User ID</div>
              <div>Status</div>
            </div>

            {/* Table body */}
            <div className="space-y-0">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-brown-secondary">
                  <p>No logs match your filters</p>
                </div>
              ) : (
                filtered.map((log, idx) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-border hover:bg-beige cursor-pointer transition-colors"
                  >
                    {/* Main row */}
                    <button
                      onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                      className="w-full grid grid-cols-5 gap-4 py-3 px-0 text-left text-sm items-center"
                    >
                      <div className="font-mono text-brown-secondary text-xs">
                        {formatToIST(log.timestamp)}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            logTypeColors(log.log_type).bg
                          } ${logTypeColors(log.log_type).text}`}
                        >
                          {log.log_type}
                        </span>
                      </div>
                      <div className="font-mono text-brown-primary text-sm">
                        {truncate(log.source_ip || '—', 20)}
                      </div>
                      <div className="text-brown-primary text-sm">
                        {log.user_id || '—'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            log.status === 'flagged'
                              ? 'bg-orange-50 text-orange-700'
                              : log.status === 'failure'
                              ? 'bg-red-50 text-red-700'
                              : log.status === 'success'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {log.status}
                        </span>
                        {expandedLog === log._id ? (
                          <ChevronUp className="w-4 h-4 text-brown-secondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-brown-secondary" />
                        )}
                      </div>
                    </button>

                    {/* Expanded JSON view */}
                    {expandedLog === log._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-beige border-t border-border px-0 py-3"
                      >
                        <pre className="font-mono text-xs text-brown-primary bg-white border border-border rounded p-3 overflow-x-auto max-h-48 overflow-y-auto">
                          {JSON.stringify(log.raw_payload, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination footer */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border text-sm text-brown-secondary">
              <span>Showing {filtered.length} logs</span>
              <div className="flex gap-2">
                <button
                  disabled
                  className="px-3 py-1 border border-border rounded opacity-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded">
                  1
                </span>
                <button
                  disabled
                  className="px-3 py-1 border border-border rounded opacity-50 cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
