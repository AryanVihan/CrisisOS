/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#111118',
        'accent-red': '#ef4444',
        'accent-amber': '#f59e0b',
        'accent-green': '#22c55e',
        'accent-blue': '#3b82f6',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'crisis-pulse': 'crisis-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'scanning': 'scanning 2.5s linear infinite',
      },
      keyframes: {
        'crisis-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 8px 2px rgba(239,68,68,0.4)',
            opacity: '1',
          },
          '50%': {
            boxShadow: '0 0 24px 8px rgba(239,68,68,0.8)',
            opacity: '0.85',
          },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scanning': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
