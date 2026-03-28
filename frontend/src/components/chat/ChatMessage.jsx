// ThreatSense — ChatMessage
// Individual chat message bubble (user or AI)

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { timeAgo } from '../../utils/helpers'

export function ChatMessage({ message, isUser }) {
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
          <p className="text-sm leading-relaxed">
            {isUser ? message.text : parseAlertLinks(message.text)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
