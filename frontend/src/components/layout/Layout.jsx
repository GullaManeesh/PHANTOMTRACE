// ThreatSense — Main Layout
// Sidebar + Topbar + Outlet for pages

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-beige">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 md:ml-60 flex flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 mt-20 md:mt-16 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
