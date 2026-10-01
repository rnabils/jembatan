/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#003366',
          50: '#e6edf5',
          100: '#c0d3e6',
          200: '#96b6d6',
          300: '#6b98c5',
          400: '#4a80b8',
          500: '#2a68aa',
          600: '#1f4f8a',
          700: '#153a68',
          800: '#0d274a',
          900: '#003366',
          950: '#001a33'
        },
        teal: {
          DEFAULT: '#00A99D',
          50: '#e0f7f5',
          100: '#b3ebe6',
          200: '#80ded6',
          300: '#4dd1c5',
          400: '#26c7b8',
          500: '#00A99D',
          600: '#00988c',
          700: '#00857a',
          800: '#007268',
          900: '#005248'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 51, 102, 0.08), 0 1px 2px -1px rgba(0, 51, 102, 0.08)',
        panel: '0 4px 16px -4px rgba(0, 51, 102, 0.12)'
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem'
      }
    }
  },
  plugins: []
}
