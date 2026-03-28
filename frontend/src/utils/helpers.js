// ThreatSense — Utility helper functions
// Used across all components

// Convert ISO timestamp to relative time string
// e.g. "2026-03-19T01:45:00Z" → "2 hours ago"
export function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1)    return 'just now'
  if (diffMins < 60)   return `${diffMins}m ago`
  if (diffHours < 24)  return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Returns Tailwind color classes for severity label
// Usage: const { bg, text, border } = severityColors('CRITICAL')
export function severityColors(label) {
  const map = {
    CRITICAL: { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-500',    dot: 'bg-red-500'    },
    HIGH:     { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', dot: 'bg-orange-500' },
    MEDIUM:   { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-500',  dot: 'bg-amber-500'  },
    LOW:      { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-500',   dot: 'bg-teal-500'   },
  }
  return map[label] || map['LOW']
}

// Returns left-border class for severity
export function severityBorderClass(label) {
  const map = {
    CRITICAL: 'border-l-4 border-l-red-500',
    HIGH:     'border-l-4 border-l-orange-500',
    MEDIUM:   'border-l-4 border-l-amber-500',
    LOW:      'border-l-4 border-l-teal-500',
  }
  return map[label] || ''
}

// Returns color for log type pill
export function logTypeColors(type) {
  const map = {
    auth:       { bg: 'bg-orange-50', text: 'text-orange-700' },
    network:    { bg: 'bg-blue-50',   text: 'text-blue-700'   },
    process:    { bg: 'bg-red-50',    text: 'text-red-700'    },
    dns:        { bg: 'bg-teal-50',   text: 'text-teal-700'   },
    behavioral: { bg: 'bg-purple-50', text: 'text-purple-700' },
  }
  return map[type] || { bg: 'bg-gray-50', text: 'text-gray-700' }
}

// Truncate string with ellipsis
export function truncate(str, maxLen = 30) {
  return str?.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

// Format number with commas
export function formatNumber(n) {
  return n?.toLocaleString() ?? '0'
}

// Generate random API key for dummy data
export function generateApiKey() {
  return 'ts_live_' + Math.random().toString(36).slice(2, 18)
}
