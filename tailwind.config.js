/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8ddc9',
          300: '#d4c3a0',
          400: '#b8a07a',
          500: '#9a7d56',
          600: '#7d6442',
          700: '#5e4d33',
          800: '#3f3322',
          900: '#261e15',
        },
        forest: {
          50: '#f0f7f4',
          100: '#dae9e1',
          200: '#b5d3c3',
          300: '#86b69a',
          400: '#5a9474',
          500: '#3d7a57',
          600: '#2d6043',
          700: '#234d36',
          800: '#1a3a28',
          900: '#0f2418',
        },
        ocean: {
          50: '#eef7fb',
          100: '#d4ecf5',
          200: '#aad9eb',
          300: '#73bedd',
          400: '#459cc4',
          500: '#2e7da6',
          600: '#246488',
          700: '#1d506e',
          800: '#173f56',
          900: '#0e2839',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
