import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Class-based dark mode — toggled by adding .dark to <html>
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Semantic theme tokens (map to CSS vars) ──────────────
        bgPrimary:     'var(--bg-primary)',
        bgCard:        'var(--bg-card)',
        bgHero:        'var(--bg-hero)',
        bgHover:       'var(--bg-hover)',
        textPrimary:   'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted:     'var(--text-muted)',
        accentPrimary: 'var(--accent-primary)',
        accentHover:   'var(--accent-hover)',
        borderColor:   'var(--border-color)',
        // ── Static brand palette ──────────────────────────────────
        brand: {
          50:  '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0',
          300: '#86EFAC', 400: '#4ADE80', 500: '#22C55E',
          600: '#16A34A', 700: '#15803D', 800: '#166534', 900: '#14532D',
        },
        trust: {
          blue:  '#2563EB',
          gold:  '#FACC15',
          green: '#22C55E',
          red:   '#EF4444',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-orbitron)', 'Orbitron', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.5), 0 1px 6px rgba(0,0,0,0.4)',
        'modal':      '0 20px 40px rgba(0,0,0,0.7)',
        'green-sm':   '0 0 0 3px rgba(34,197,94,0.15)',
        'blue-sm':    '0 0 0 3px rgba(37,99,235,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
