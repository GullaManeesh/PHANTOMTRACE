// ThreatSense — Main app router
// Wraps everything in AuthProvider
// Routes: public (auth pages) and protected (dashboard + pages with sidebar)

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ApiKeySetup from './pages/auth/ApiKeySetup'

// Dashboard & pages
import Dashboard from './pages/Dashboard'
import AlertDetail from './pages/AlertDetail'
import LogExplorer from './pages/LogExplorer'
import AgentMonitor from './pages/AgentMonitor'
import ThreatMap from './pages/ThreatMap'
import MitreView from './pages/MitreView'
import Chat from './pages/Chat'
import Reports from './pages/Reports'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/api-key-setup" element={<ApiKeySetup />} />

          {/* Protected routes — with sidebar layout */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts/:id" element={<AlertDetail />} />
            <Route path="/logs" element={<LogExplorer />} />
            <Route path="/agents" element={<AgentMonitor />} />
            <Route path="/map" element={<ThreatMap />} />
            <Route path="/mitre" element={<MitreView />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
