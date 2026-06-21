/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // Deep zinc dark
        foreground: '#f4f4f5',
        card: '#18181b',
        border: '#27272a',
        primary: {
          DEFAULT: '#6366f1', // Indigo accent
          hover: '#4f46e5',
        },
        accent: {
          DEFAULT: '#3b82f6', // Blue
          green: '#10b981',   // Emerald
          orange: '#f97316',  // Orange
          red: '#ef4444',     // Red
          purple: '#8b5cf6',  // Purple
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.15)',
      }
    },
  },
  plugins: [],
}
