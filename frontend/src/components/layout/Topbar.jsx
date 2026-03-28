// ThreatSense — Topbar
// White headers with page title and right-side status indicators

import { useLocation } from 'react-router-dom'
import { Bell, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { DUMMY_ALERTS, DUMMY_STATS } from '../../data/dummyData'

export function Topbar() {
  const location = useLocation()
  const { client } = useAuth()

  // Map routes to titles
  const routeTitles = {
    '/': 'Dashboard',
    '/logs': 'Log Explorer',
    '/agents': 'Agent Monitor',
    '/map': 'Threat Map',
    '/mitre': 'MITRE ATT&CK',
    '/chat': 'AI Chat',
    '/reports': 'Reports',
  }

  const pageTitle = routeTitles[location.pathname] || 'Dashboard'

  // Count unacknowledged alerts
  const unacknowledgedCount = DUMMY_ALERTS.filter(a => !a.acknowledged).length

  return (
    <header className="hidden md:block fixed top-0 right-0 left-60 h-16 bg-white border-b border-border px-8 z-10">
      <div className="flex items-center justify-between h-full">
        <h2 className="text-xl font-bold text-brown-primary">{pageTitle}</h2>

        <div className="flex items-center gap-4">
          {/* Agents active indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-brown-secondary">{DUMMY_STATS.agents_active} agents active</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border"></div>

          {/* Alert bell */}
          <div className="relative">
            <Bell className="w-5 h-5 text-brown-secondary cursor-pointer hover:text-brown-primary transition-colors" />
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unacknowledgedCount}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border"></div>

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
