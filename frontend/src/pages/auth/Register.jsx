// ThreatSense — Register page
// Same split layout as login, but with additional fields
// Name, email, website name, URL, password

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, User, Mail, Globe, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website_name: '',
    website_url: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      register(formData)
      setLoading(false)
      navigate('/api-key-setup')
    }, 800)
  }

  return (
    <div className="min-h-screen flex bg-beige">
      {/* Left panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex md:w-3/5 bg-gradient-to-br from-orange-DEFAULT to-orange-hover flex-col justify-center items-center px-12 py-8"
      >
        <div className="max-w-md">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 bg-cream rounded-lg">
              <Shield className="w-8 h-8 text-orange-DEFAULT" />
            </div>
            <h1 className="text-4xl font-bold text-cream">ThreatSense</h1>
          </div>

          <h2 className="text-3xl font-bold text-cream mb-4">
            Secure Your Website Today
          </h2>

          <div className="space-y-4 mt-12">
            {[
              'Set up in minutes',
              'Get instant threat alerts',
              'Start protecting your business',
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

      {/* Right panel */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-2/5 flex flex-col justify-center items-center px-6 md:px-12 py-8"
      >
        <div className="w-full max-w-sm">
          <h3 className="text-3xl font-bold text-brown-primary mb-2">Create your account</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Your name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-brown-secondary" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-brown-secondary" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
                />
              </div>
            </div>

            {/* Website name */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Website name</label>
              <input
                type="text"
                name="website_name"
                value={formData.website_name}
                onChange={handleChange}
                placeholder="e.g., EcomStore"
                className="w-full px-4 py-2 bg-beige border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-DEFAULT"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-brown-primary mb-2">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 w-5 h-5 text-brown-secondary" />
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://example.com"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
              className="w-full mt-6 bg-orange-DEFAULT text-white font-semibold py-2.5 rounded-lg hover:bg-orange-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-brown-secondary text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-DEFAULT font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
