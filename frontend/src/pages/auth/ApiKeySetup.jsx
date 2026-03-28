// ThreatSense — API Key Setup page
// Shown after registration
// Displays the API key, copy button, and integration code snippet

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Copy, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function ApiKeySetup() {
  const navigate = useNavigate()
  const { client } = useAuth()
  const [copied, setCopied] = useState(false)

  const apiKey = client?.api_key || 'ts_live_k9x2mq7rtp4j8nve'

  function copyToClipboard() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-beige flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full"
      >
        {/* Success checkmark */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </motion.div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-brown-primary mb-3">
          Your account is ready!
        </h1>
        <p className="text-center text-brown-secondary text-lg mb-12">
          Here is your unique API key. Add it to your website to start sending logs.
        </p>

        {/* API Key display */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white card mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-brown-secondary uppercase tracking-wide mb-2">API Key</p>
              <code className="font-mono text-lg text-brown-primary break-all">
                {apiKey}
              </code>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
                copied
                  ? 'bg-green-50 text-green-600'
                  : 'bg-beige text-orange-DEFAULT hover:bg-orange-tint'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-sm mt-2">
              Copied to clipboard!
            </motion.p>
          )}
        </motion.div>

        {/* Code snippet */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-brown-primary font-semibold mb-3">Integration example:</p>
          <pre className="bg-brown-primary text-cream p-6 rounded-lg overflow-x-auto font-mono text-sm">
{`// Add this to your website
const API_KEY = "${apiKey}";

fetch("https://api.threatsense.ai/logs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  body: JSON.stringify({
    log_type: "auth",
    source: "mywebsite",
    event: "login_attempt",
    timestamp: new Date().toISOString(),
  })
});`}
          </pre>
        </motion.div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-orange-DEFAULT text-white font-semibold rounded-lg hover:bg-orange-hover transition-colors"
          >
            Go to Dashboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-3 text-orange-DEFAULT font-semibold hover:underline"
          >
            I'll set this up later
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
