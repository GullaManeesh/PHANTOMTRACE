// ThreatSense — Sidebar
// Fixed left sidebar with navigation, 240px wide
// Shows logo, client info, nav items, and logout

import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, LayoutDashboard, Bell, List, Cpu, Globe, ShieldAlert,
  MessageSquare, BarChart2, Settings, LogOut, Menu, X, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'

export function Sidebar() {
  const { client, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/', label: 'Live Alerts', icon: Bell, badge: true },
    { path: '/logs', label: 'Log Explorer', icon: List },
    { path: '/agents', label: 'Agent Monitor', icon: Cpu },
    { path: '/map', label: 'Threat Map', icon: Globe },
    { path: '/mitre', label: 'MITRE ATT&CK', icon: ShieldAlert },
    { path: '/chat', label: 'AI Chat', icon: MessageSquare, badge: true, badgeLabel: 'AI' },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
  ]

  const isActive = (navPath) => location.pathname === navPath

  const sidebarContent = (
    <div className="flex flex-col h-screen bg-sidebar text-cream overflow-y-auto">
      {/* Logo section */}
      <div className="px-6 py-6 border-b border-[#3D2418]">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-orange-DEFAULT" />
          <h1 className="text-lg font-bold text-cream">ThreatSense</h1>
        </div>
      </div>

      {/* Client info section */}
      <div className="px-6 py-5 border-b border-[#3D2418]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-DEFAULT flex items-center justify-center text-white text-xs font-bold">
            {client?.name?.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-cream">{client?.website_name}</p>
            <span className="inline-block text-xs bg-orange-DEFAULT text-white px-2 py-0.5 rounded-full mt-1">
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 mb-1 relative',
                  active
                    ? 'bg-[#3D2418] text-cream border-l-3 border-l-orange-DEFAULT'
                    : 'text-cream hover:bg-[#3D2418] hover:bg-opacity-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <div className="ml-auto">
                    {item.badgeLabel ? (
                      <span className="text-xs bg-orange-DEFAULT text-white px-2 py-0.5 rounded-full font-semibold">
                        {item.badgeLabel}
                      </span>
                    ) : (
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-[#3D2418] space-y-2">
        <button
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-cream hover:bg-[#3D2418] transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-cream hover:bg-red-600 hover:bg-opacity-20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign out</span>
        </button>

        <p className="text-xs text-cream text-opacity-50 px-4 pt-2">v1.0.0</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block w-60 bg-sidebar fixed left-0 top-0 h-screen z-20 overflow-y-auto">
        {sidebarContent}
      </div>

      {/* Mobile hamburger menu */}
      <div className="md:hidden fixed top-0 left-0 z-30">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-4 text-brown-primary"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar panel */}
      <motion.div
        initial={{ x: -240 }}
        animate={{ x: mobileOpen ? 0 : -240 }}
        transition={{ duration: 0.3 }}
        className="md:hidden fixed left-0 top-0 h-full w-60 z-20"
      >
        {sidebarContent}
      </motion.div>
    </>
  )
}
