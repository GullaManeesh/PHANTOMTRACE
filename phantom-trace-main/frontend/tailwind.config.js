export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        beige:   '#FAF7F2',
        surface: '#FFFFFF',
        border:  '#EDE8E0',
        sidebar: '#2C1810',
        cream:   '#F5ECD7',
        'orange-DEFAULT': '#E8631A',
        'orange-hover': '#C4511A',
        'orange-tint': '#FEF0E7',
        orange:  {
          DEFAULT: '#E8631A',
          hover:   '#C4511A',
          tint:    '#FEF0E7',
        },
        brown: {
          primary:   '#1C1410',
          secondary: '#6B5B4E',
        },
        severity: {
          critical: '#DC2626',
          high:     '#EA580C',
          medium:   '#D97706',
          low:      '#0D9488',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'pulse-slow':   'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-dot':   'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        }
      }
    }
  },
  plugins: []
}
