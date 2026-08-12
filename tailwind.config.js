/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F6F2E9',
          deep: '#EFE8DA',
        },
        ink: {
          DEFAULT: '#191D19',
          soft: '#4B5249',
          muted: '#7C8378',
        },
        pine: {
          DEFAULT: '#2F4A3C',
          dark: '#22352B',
          deep: '#18251F',
          soft: '#E6EDE6',
          line: '#C8D4C6',
        },
        brass: {
          DEFAULT: '#B07D3F',
          dark: '#8F6330',
          soft: '#F1E5CE',
        },
        clay: {
          DEFAULT: '#A4402F',
          soft: '#F6E3DE',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(25, 29, 25, 0.05), 0 8px 24px -12px rgba(25, 29, 25, 0.18)',
        lift: '0 2px 4px rgba(25, 29, 25, 0.06), 0 18px 40px -16px rgba(25, 29, 25, 0.28)',
      },
      letterSpacing: {
        wide2: '0.18em',
      },
      maxWidth: {
        site: '80rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease both',
      },
    },
  },
  plugins: [],
}