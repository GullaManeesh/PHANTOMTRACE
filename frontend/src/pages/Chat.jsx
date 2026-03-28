// ThreatSense — Chat
// AI Chat interface with message history and suggested prompts

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, Trash2, Shield } from 'lucide-react'
import { ChatMessage } from '../components/chat/ChatMessage'
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts'
import { DUMMY_CHAT_RESPONSES } from '../data/dummyData'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [rows, setRows] = useState(1)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value)
    const newRows = Math.min(e.target.value.split('\n').length, 4)
    setRows(Math.max(newRows, 1))
  }

  // Choose response based on message content
  const getAIResponse = (userMessage) => {
    const lower = userMessage.toLowerCase()
    if (lower.includes('critical')) return DUMMY_CHAT_RESPONSES.critical
    if (lower.includes('user')) return DUMMY_CHAT_RESPONSES.user
    if (lower.includes('summary') || lower.includes('manager')) return DUMMY_CHAT_RESPONSES.summary
    return DUMMY_CHAT_RESPONSES.default
  }

  // Send message
  const handleSend = async (text = null) => {
    const messageText = text || input.trim()
    if (!messageText) return

    // Add user message
    setMessages(prev => [...prev, { text: messageText, isUser: true }])
    setInput('')
    setRows(1)

    // Simulate AI response with typing indicator
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const aiResponse = getAIResponse(messageText)

      // Word-by-word streaming effect
      let currentText = ''
      const words = aiResponse.split(' ')
      let wordIndex = 0

      const streamWord = () => {
        if (wordIndex < words.length) {
          currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex]
          setMessages(prev => {
            const newMessages = [...prev]
            if (newMessages[newMessages.length - 1]?.isUser) {
              newMessages.push({ text: currentText, isUser: false })
            } else {
              newMessages[newMessages.length - 1] = { text: currentText, isUser: false }
            }
            return newMessages
          })
          wordIndex++
          setTimeout(streamWord, 40)
        }
      }

      streamWord()
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-4 border-b border-border flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-DEFAULT flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-brown-primary">ThreatSense AI</h2>
            <span className="text-xs bg-orange-DEFAULT text-white px-2 py-0.5 rounded">
              Powered by Claude
            </span>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="p-2 text-brown-secondary hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-6 px-4 bg-beige">
        {messages.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <Shield className="w-12 h-12 text-orange-DEFAULT mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-brown-primary mb-2">
              Ask me anything about your threats
            </h3>
            <p className="text-brown-secondary mb-8">
              I have access to all your alerts, logs, and agent findings
            </p>
            <SuggestedPrompts onPromptClick={handleSend} />
          </motion.div>
        ) : (
          // Message list
          <>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} isUser={msg.isUser} />
              ))}
            </div>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 max-w-xs max-w-3xl mx-auto"
              >
                <div className="w-8 h-8 rounded-full bg-sidebar flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-cream" />
                </div>
                <div className="bg-white border border-border rounded-2xl px-4 py-3 rounded-tl-none">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-orange-DEFAULT"
                      ></motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-border bg-white px-4 py-4"
      >
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about threats, alerts, or request a summary..."
            rows={rows}
            className="flex-1 px-4 py-3 bg-beige border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 p-3 bg-orange-DEFAULT text-white rounded-xl hover:bg-orange-hover disabled:bg-gray-300 transition-colors flex items-center justify-center h-12 w-12"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
