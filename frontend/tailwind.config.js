/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#f8fafc',
        primary: {
          50: 'var(--color-primary-100)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-100)',
          300: 'var(--color-primary-500)',
          400: 'var(--color-primary-500)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-600)',
          800: 'var(--color-primary-600)',
          900: 'var(--color-primary-600)',
        },
        secondary: {
          50: 'var(--color-primary-100)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-100)',
          300: 'var(--color-primary-500)',
          400: 'var(--color-primary-500)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-500)',
          700: 'var(--color-secondary-500)',
          800: 'var(--color-secondary-500)',
          900: 'var(--color-secondary-500)',
        },
        accent: {
          50: 'var(--color-primary-100)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-100)',
          300: 'var(--color-accent-500)',
          400: 'var(--color-accent-500)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-600)',
          800: 'var(--color-accent-600)',
          900: 'var(--color-accent-600)',
        },
        dark: {
          950: 'var(--color-app-bg)',
          900: 'var(--color-app-card-bg)',
          800: 'var(--color-app-card-bg)',
          750: 'var(--color-app-border)',
          700: 'var(--color-app-border)',
          600: 'var(--color-app-text-secondary)',
          850: 'var(--color-app-text-primary)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-smooth': 'spin-smooth 1s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'premium': '0 8px 32px 0 rgba(59, 130, 246, 0.1)',
        'premium-lg': '0 12px 48px 0 rgba(59, 130, 246, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
