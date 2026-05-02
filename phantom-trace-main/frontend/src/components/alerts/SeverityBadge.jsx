// ThreatSense — SeverityBadge
// Pill-shaped badge showing alert severity level
// Supports different sizes: sm, md (default), lg

import clsx from 'clsx'

export function SeverityBadge({ label, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const colorMap = {
    CRITICAL: {
      container: 'bg-red-50 border border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
    HIGH: {
      container: 'bg-orange-50 border border-orange-200',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      container: 'bg-amber-50 border border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    LOW: {
      container: 'bg-teal-50 border border-teal-200',
      text: 'text-teal-700',
      dot: 'bg-teal-500',
    },
  }

  const colors = colorMap[label] || colorMap.LOW

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full font-medium',
        sizeClasses[size],
        colors.container,
        colors.text
      )}
    >
      <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', colors.dot)}></span>
      {label}
    </span>
  )
}
