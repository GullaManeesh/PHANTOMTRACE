// ThreatSense — Login page
// Split layout: left orange gradient panel, right login form card
// Features checklist on left, form on right

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API delay
    setTimeout(() => {
      login(email, password)
      setLoading(false)
      navigate('/')
    }, 800)
  }

  return (
    <div className="min-h-screen flex bg-beige">
      {/* Left panel - Orange gradient with features */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex md:w-3/5 bg-gradient-to-br from-orange-DEFAULT to-orange-hover flex-col justify-center items-center px-12 py-8"
      >
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 bg-cream rounded-lg">
              <Shield className="w-8 h-8 text-orange-DEFAULT" />
            </div>
            <h1 className="text-4xl font-bold text-cream">ThreatSense</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-cream mb-4">
            AI-Powered Threat Detection for Your Website
          </h2>

          {/* Features */}
          <div className="space-y-4 mt-12">
            {[
              'Real-time threat monitoring',
              '5-agent AI analysis pipeline',
              'Claude AI powered insights',
            ].map((feature, idx) => (
              <motion.div
                key={feature}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-orange-DEFAULT" />
                </div>
                <span className="text-cream text-lg">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel - Login form */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-2/5 flex flex-col justify-center items-center px-6 md:px-12 py-8"
      >
        <div className="w-full max-w-sm">
          <h3 className="text-3xl font-bold text-brown-primary mb-2">Welcome back</h3>
          <p className="text-brown-secondary text-sm mb-8">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-brown-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-brown-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-brown-secondary hover:text-brown-primary"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-orange-DEFAULT text-white font-semibold py-2.5 rounded-lg hover:bg-orange-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-brown-secondary text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-DEFAULT font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
