// ThreatSense — Auth context
// Simulates logged-in state with dummy client data
// In production this would handle JWT tokens and real login API calls
// For dummy version: isAuthenticated starts false so we can test login flow

import { createContext, useContext, useState } from 'react'
import { DUMMY_CLIENT } from '../data/dummyData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Set to false to test login flow, true to skip straight to dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [client, setClient] = useState(null)

  function login(email, password) {
    // Dummy login — accept any credentials
    // In production: POST /api/auth/login → get JWT → store in localStorage
    setClient(DUMMY_CLIENT)
    setIsAuthenticated(true)
  }

  function register(data) {
    // Dummy register — always succeeds
    // In production: POST /api/auth/register → get JWT + api_key
    setClient({ ...DUMMY_CLIENT, ...data })
    setIsAuthenticated(true)
  }

  function logout() {
    setClient(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, client, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
