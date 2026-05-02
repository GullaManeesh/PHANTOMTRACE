import { createContext, useContext, useEffect, useState } from 'react'
import { apiJson, clearSession, getStoredSession, saveSession } from '../utils/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [client, setClient] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const session = getStoredSession()
    if (session.isAuthenticated && session.user) {
      setClient(session.user)
      setIsAuthenticated(true)
    }
    setIsBootstrapping(false)
  }, [])

  async function login(email, password) {
    const payload = await apiJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    saveSession(payload)
    setClient(payload.user)
    setIsAuthenticated(true)
    return payload
  }

  async function register(data) {
    const payload = await apiJson('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    saveSession(payload)
    setClient(payload.user)
    setIsAuthenticated(true)
    return payload
  }

  function logout() {
    clearSession()
    setClient(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, client, isBootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
