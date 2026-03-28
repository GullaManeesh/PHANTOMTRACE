// ThreatSense — SuggestedPrompts
// Chips showing suggested prompts for the AI chat

import { motion } from 'framer-motion'
import { SUGGESTED_PROMPTS } from '../../data/dummyData'
import * as Icons from 'lucide-react'

export function SuggestedPrompts({ onPromptClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto"
    >
      {SUGGESTED_PROMPTS.map((prompt, idx) => {
        // Dynamically get icon
        const IconComponent = Icons[prompt.icon]

        return (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onPromptClick(prompt.text)}
            className="card flex gap-3 items-start text-left hover:bg-orange-tint hover:border-orange-DEFAULT transition-all"
          >
            {IconComponent && (
              <IconComponent className="w-4 h-4 text-orange-DEFAULT flex-shrink-0 mt-1" />
            )}
            <span className="text-sm text-brown-primary font-medium">{prompt.text}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
