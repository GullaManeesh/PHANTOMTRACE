import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Plus, Trash2, Check, KeyRound } from 'lucide-react'
import { apiJson } from '../utils/apiClient'

function formatDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: true,
  }).format(date)
}

function maskedDotsForKey(value) {
  const dotCount = Math.max(20, Math.min(40, (value || '').length))
  return '●'.repeat(dotCount)
}

export default function Settings() {
  const [apiKeys, setApiKeys] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState('')
  const [deletingKeyId, setDeletingKeyId] = useState('')

  const activeCount = useMemo(() => apiKeys.length, [apiKeys])

  async function loadApiKeys() {
    setIsLoading(true)
    setError('')
    try {
      const payload = await apiJson('/auth/api-keys')
      setApiKeys(payload.api_keys || [])
    } catch (err) {
      setError(err?.message || 'Failed to load API keys.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  async function handleCreateKey() {
    setIsCreating(true)
    setError('')
    try {
      const payload = await apiJson('/auth/api-keys', { method: 'POST' })
      const created = payload.api_key_record
      if (created) {
        setApiKeys((prev) => [created, ...prev])
      }
    } catch (err) {
      setError(err?.message || 'Failed to create API key.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopy(rawKey, keyId) {
    if (!rawKey) {
      setError('This key cannot be copied because its raw value is unavailable.')
      return
    }

    try {
      await navigator.clipboard.writeText(rawKey)
      setCopiedKeyId(keyId)
      setTimeout(() => setCopiedKeyId(''), 1800)
    } catch {
      setError('Failed to copy API key to clipboard.')
    }
  }

  async function handleDelete(keyId) {
    setDeletingKeyId(keyId)
    setError('')
    try {
      await apiJson(`/auth/api-keys/${keyId}`, { method: 'DELETE' })
      setApiKeys((prev) => prev.filter((item) => item.id !== keyId))
    } catch (err) {
      setError(err?.message || 'Failed to delete API key.')
    } finally {
      setDeletingKeyId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brown-primary">Settings</h1>
            <p className="text-brown-secondary mt-1">
              Manage your API keys. Keys stay masked on screen using large dots.
            </p>
          </div>

          <button
            onClick={handleCreateKey}
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-DEFAULT text-white font-semibold hover:bg-orange-hover disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create New Key'}
          </button>
        </div>
      </div>

      <div className="bg-white card">
        <div className="flex items-center gap-2 text-brown-primary">
          <KeyRound className="w-5 h-5" />
          <h2 className="text-lg font-semibold">API Keys ({activeCount})</h2>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {isLoading ? (
          <p className="text-brown-secondary mt-4">Loading API keys...</p>
        ) : apiKeys.length === 0 ? (
          <p className="text-brown-secondary mt-4">No API keys yet. Create one to start ingesting logs.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {apiKeys.map((key, index) => {
              const deleting = deletingKeyId === key.id
              const copied = copiedKeyId === key.id
              return (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border border-orange-tint bg-beige/40 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-brown-secondary">Key</p>
                      <div className="mt-1 text-2xl leading-none tracking-widest text-brown-primary select-none">
                        {maskedDotsForKey(key.api_key)}
                      </div>
                      <p className="mt-2 text-sm text-brown-secondary break-all">{key.hint}</p>
                      <p className="text-xs text-brown-secondary mt-1">
                        Created: {formatDate(key.created_at)} | Last used: {formatDate(key.last_used_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(key.api_key, key.id)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-white border border-orange-tint text-brown-primary hover:bg-orange-tint/20"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>

                      <button
                        onClick={() => handleDelete(key.id)}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
