// ThreatSense — Chat
// Real-time chat UI connected to backend agents

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SendHorizontal, Trash2, Shield, MessageSquareText, Bot } from 'lucide-react'
import { ChatMessage } from '../components/chat/ChatMessage'
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts'
import { apiJson } from '../utils/apiClient'

const AGENT_OPTIONS = [
  { value: 'network', label: 'Network' },
  { value: 'auth', label: 'Auth' },
  { value: 'behavioural', label: 'Behavioural' },
  { value: 'orchestrator', label: 'Orchestrator' },
  { value: 'explainer', label: 'Explainer' },
]

const MODE_OPTIONS = [
  { value: 'agent', label: 'Agent mode', icon: Bot },
  { value: 'chat', label: 'Chat mode', icon: MessageSquareText },
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [rows, setRows] = useState(1)
  const [selectedAgent, setSelectedAgent] = useState('orchestrator')
  const [selectedMode, setSelectedMode] = useState('agent')
  const [liveThinkingSteps, setLiveThinkingSteps] = useState([])
  const messagesEndRef = useRef(null)
  const threadIdRef = useRef(crypto.randomUUID())

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

  const runLiveThinking = (agent) => {
    const steps = [
      `Forwarding request to ${agent} agent`,
      'Doing research on threat context',
      'Compiling results and confidence',
    ]

    setLiveThinkingSteps([])
    steps.forEach((step, index) => {
      setTimeout(() => {
        setLiveThinkingSteps(prev => [...prev, step])
      }, index * 500)
    })
  }

  const callAgentChat = async (messageText, agent) => {
    return apiJson('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        agent,
        mode: selectedMode,
        thread_id: selectedMode === 'chat' ? 'all' : threadIdRef.current,
      }),
    })
  }

  const handleSend = async (text = null) => {
    const messageText = text || input.trim()
    if (!messageText) return

    setMessages(prev => [...prev, { text: messageText, isUser: true }])
    setInput('')
    setRows(1)
    setIsTyping(true)

    if (selectedMode === 'agent') {
      runLiveThinking(selectedAgent)
    } else {
      setLiveThinkingSteps([])
    }

    try {
      const chatPayload = await callAgentChat(messageText, selectedAgent)

      setMessages(prev => [
        ...prev,
        {
          text: chatPayload.response,
          isUser: false,
          agent: chatPayload.agent,
          mode: chatPayload.mode || selectedMode,
          timestamp: new Date().toISOString(),
          thinkingSteps: selectedMode === 'agent' && Array.isArray(chatPayload.thinking_steps)
            ? chatPayload.thinking_steps
            : [],
        },
      ])
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          text: `Error: ${error.message || 'Unable to reach backend chat service.'}`,
          isUser: false,
          agent: selectedAgent,
          timestamp: new Date().toISOString(),
          thinkingSteps: [
            `Forwarding request to ${selectedAgent} agent`,
            'Request failed while waiting for backend response',
            'Please verify the backend server and API key configuration',
          ],
        },
      ])
    } finally {
      setIsTyping(false)
      setLiveThinkingSteps([])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 pb-4 border-b border-border flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-DEFAULT flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-brown-primary">ThreatSense AI</h2>
            <span className="text-xs bg-orange-DEFAULT text-white px-2 py-0.5 rounded">
              Live Agent Chat
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

      <div className="shrink-0">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 bg-white border border-border rounded-2xl p-2">
          {MODE_OPTIONS.map((modeOption) => {
            const ModeIcon = modeOption.icon
            const isActive = selectedMode === modeOption.value

            return (
              <button
                key={modeOption.value}
                onClick={() => setSelectedMode(modeOption.value)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-DEFAULT text-white'
                    : 'bg-beige text-brown-primary hover:bg-orange-tint'
                }`}
              >
                <ModeIcon className="w-4 h-4" />
                {modeOption.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-4 bg-beige">
        {selectedMode === 'agent' && (
          <div className="max-w-3xl mx-auto mb-4">
            <div className="bg-white border border-border rounded-xl p-3">
              <p className="text-xs text-brown-secondary mb-2">Choose an agent</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {AGENT_OPTIONS.map((agentOption) => (
                  <button
                    key={agentOption.value}
                    onClick={() => setSelectedAgent(agentOption.value)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      selectedAgent === agentOption.value
                        ? 'bg-orange-DEFAULT text-white border-orange-DEFAULT'
                        : 'bg-beige text-brown-primary border-border hover:border-orange-DEFAULT'
                    }`}
                  >
                    {agentOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-start min-h-full pt-12 text-center"
          >
            <Shield className="w-12 h-12 text-orange-DEFAULT mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-brown-primary mb-2">
              {selectedMode === 'chat'
                ? 'Chat naturally with the security assistant'
                : 'Ask me anything about your threats'}
            </h3>
            <p className="text-brown-secondary mb-8">
              {selectedMode === 'chat'
                ? 'This mode replies in plain language while still grounding answers in telemetry.'
                : 'I have access to all your alerts, logs, and agent findings'}
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
                className="flex gap-3 max-w-3xl mx-auto"
              >
                <div className="w-8 h-8 rounded-full bg-sidebar flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-cream" />
                </div>
                <div className="bg-white border border-border rounded-2xl px-4 py-3 rounded-tl-none">
                  <div className="flex gap-1 mb-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-orange-DEFAULT"
                      ></motion.div>
                    ))}
                  </div>

                  {selectedMode === 'agent' && liveThinkingSteps.length > 0 && (
                    <div className="space-y-1 text-xs text-brown-secondary">
                      {liveThinkingSteps.map((step, index) => (
                        <p key={`${step}-${index}`}>{index + 1}. {step}</p>
                      ))}
                    </div>
                  )}
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
            placeholder={selectedMode === 'chat'
              ? 'Ask a follow-up in natural language...'
              : 'Ask about threats, alerts, or request a summary...'}
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
