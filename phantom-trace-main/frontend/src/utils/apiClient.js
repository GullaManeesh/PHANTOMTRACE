const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const TOKEN_STORAGE_KEY = 'pt_auth_token'
const API_KEY_STORAGE_KEY = 'pt_api_key'
const USER_STORAGE_KEY = 'pt_auth_user'

function parseJsonSafely(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export function getStoredSession() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
  const userRaw = localStorage.getItem(USER_STORAGE_KEY)
  const user = userRaw ? parseJsonSafely(userRaw) : null

  return {
    token,
    apiKey,
    user,
    isAuthenticated: Boolean(token || apiKey),
  }
}

export function saveSession({ access_token, api_key, user }) {
  if (access_token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, access_token)
  }

  if (api_key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, api_key)
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function buildAuthHeaders(initialHeaders = {}) {
  const headers = { ...initialHeaders }
  const { token, apiKey } = getStoredSession()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  return headers
}

async function parseApiError(response, fallback) {
  try {
    const payload = await response.json()
    return payload.detail || payload.message || fallback
  } catch {
    return fallback
  }
}

export async function apiRequest(path, options = {}) {
  const isAbsolute = path.startsWith('http://') || path.startsWith('https://')
  const url = isAbsolute ? path : `${API_BASE_URL}${path}`

  const headers = buildAuthHeaders(options.headers || {})

  return fetch(url, {
    ...options,
    headers,
  })
}

export async function apiJson(path, options = {}) {
  const response = await apiRequest(path, options)

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`
    const detail = await parseApiError(response, fallback)
    throw new Error(detail)
  }

  return response.json()
}
