// ThreatSense — Topbar
// White headers with page title and right-side status indicators

import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import { useAgents } from '../../hooks/useAgents'

export function Topbar() {
  const location = useLocation()
  const { client } = useAuth()
  const { alerts } = useAlerts('all')
  const { overview } = useAgents('all')

  // Map routes to titles
  const routeTitles = {
    '/': 'Dashboard',
    '/logs': 'Log Explorer',
    '/agents': 'Agent Monitor',
    '/map': 'Threat Map',
    '/chat': 'AI Chat',
    '/reports': 'Reports',
  }

  const pageTitle = routeTitles[location.pathname] || 'Dashboard'

  // Count unacknowledged alerts
  const unacknowledgedCount = (alerts || []).filter((a) => !a.acknowledged).length
  const activeAgents = Number(overview?.active_agents || 0)

  return (
    <header className="hidden md:block fixed top-0 right-0 left-60 h-16 bg-white border-b border-border px-8 z-10">
      <div className="flex items-center justify-between h-full">
        <h2 className="text-xl font-bold text-brown-primary">{pageTitle}</h2>

        <div className="flex items-center gap-4">
          {/* Agents active indicator (dot only) */}
          <div className="flex items-center gap-2" aria-hidden>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Client info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-DEFAULT flex items-center justify-center text-white text-xs font-bold">
              {client?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-sm font-medium text-brown-primary">{client?.website_name}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
