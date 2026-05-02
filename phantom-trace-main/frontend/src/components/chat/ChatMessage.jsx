// ThreatSense — ChatMessage
// Individual chat message bubble (user or AI)

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { timeAgo } from '../../utils/helpers'

export function ChatMessage({ message, isUser }) {
  const [showThinking, setShowThinking] = useState(false)

  // Parse alert links in text
  const parseAlertLinks = (text) => {
    return text.split(/(ALERT-alert_\d{3})/g).map((part, idx) => {
      if (part.match(/^ALERT-alert_\d{3}$/)) {
        const alertId = part.replace('ALERT-', '')
        return (
          <Link
            key={idx}
            to={`/alerts/${alertId}`}
            className="text-orange-DEFAULT underline font-semibold hover:text-orange-hover"
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex gap-3 max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-sidebar flex items-center justify-center flex-shrink-0 mt-1">
            <Shield className="w-4 h-4 text-cream" />
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-orange-DEFAULT text-white rounded-tr-none'
              : 'bg-white border border-border text-brown-primary rounded-tl-none'
          }`}
        >
          {!isUser && (
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-brown-secondary">
              <div className="flex items-center gap-2">
                {message.agent && (
                  <span className="bg-orange-tint text-orange-DEFAULT px-2 py-0.5 rounded-full font-medium">
                    {message.agent === 'chat' ? 'Chat mode' : `${message.agent} agent`}
                  </span>
                )}
                {message.timestamp && <span>{timeAgo(message.timestamp)}</span>}
              </div>

              {Array.isArray(message.thinkingSteps) && message.thinkingSteps.length > 0 && (
                <button
                  onClick={() => setShowThinking(prev => !prev)}
                  className="inline-flex items-center gap-1 text-orange-DEFAULT hover:text-orange-hover"
                >
                  Show thinking
                  {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          {!isUser && showThinking && Array.isArray(message.thinkingSteps) && message.thinkingSteps.length > 0 && (
            <div className="mb-3 bg-beige border border-border rounded-lg p-3 text-xs text-brown-secondary space-y-1">
              {message.thinkingSteps.map((step, index) => (
                <div key={`${step}-${index}`} className="flex items-start gap-2">
                  <span className="text-orange-DEFAULT">{index + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed">
            {isUser ? message.text : parseAlertLinks(message.text)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
