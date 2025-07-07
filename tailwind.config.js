/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
      colors: {
        // GoGoBubbles Brand Colors (exact matches from HTML)
        'brand': {
          'aqua': '#4fd1c5',
          'aqua-light': '#2ed8c3', 
          'aqua-dark': '#1fc2a7',
          'blue': '#4299e1',
          'blue-dark': '#3182ce',
          'yellow': '#FFD166',
          'red': '#E63946',
        },
        // Background gradients
        'gradient': {
          'primary': 'linear-gradient(120deg, #4fd1c5 0%, #4299e1 100%)',
          'secondary': 'linear-gradient(120deg, #4299e1 0%, #4fd1c5 100%)',
        },
        // Extended color palette for UI
        'aqua': {
          50: '#f0fdfd',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#4fd1c5', // Brand aqua
          600: '#2ed8c3', // Brand aqua-light
          700: '#1fc2a7', // Brand aqua-dark
          800: '#0d9488',
          900: '#0f766e',
        },
        'blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#4299e1', // Brand blue
          600: '#3182ce', // Brand blue-dark
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'gray': {
          50: '#f8fafc', // Light background from HTML
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(120deg, #4fd1c5 0%, #4299e1 100%)',
        'gradient-secondary': 'linear-gradient(120deg, #4299e1 0%, #4fd1c5 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(44,62,80,0.10)',
        'button': '0 4px 10px rgba(0,0,0,0.1)',
        'button-hover': '0 6px 12px rgba(0,0,0,0.15)',
        'sticky': '0 -2px 12px rgba(44,62,80,0.10)',
      },
      borderRadius: {
        'xl': '1.2rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'logo-float': 'logo-float 3.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'logo-float': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} 