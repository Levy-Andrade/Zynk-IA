/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zynk: {
          bg: '#040711',
          card: 'rgba(9, 16, 32, 0.75)',
          border: 'rgba(0, 240, 255, 0.25)',
          borderGlow: 'rgba(0, 240, 255, 0.6)',
          cyan: '#00f0ff',
          neonBlue: '#0070f3',
          deepBlue: '#051129',
          accent: '#7000ff',
          textMuted: '#8ba2c4',
          textBright: '#e6f7ff',
          emerald: '#00ffaa',
          crimson: '#ff3366',
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-blue': '0 0 15px rgba(0, 112, 243, 0.5), 0 0 30px rgba(0, 112, 243, 0.2)',
        'neon-emerald': '0 0 15px rgba(0, 255, 170, 0.5), 0 0 30px rgba(0, 255, 170, 0.2)',
        'neon-crimson': '0 0 15px rgba(255, 51, 102, 0.5), 0 0 30px rgba(255, 51, 102, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
        'reverse-spin': 'reverseSpin 18s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        reverseSpin: {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
