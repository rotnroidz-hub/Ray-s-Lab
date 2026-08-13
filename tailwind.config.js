/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F4EF',
          '2': '#FAF9F5',
        },
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#0E1013',
          '2': '#1B1E23',
          soft: '#5B6169',
          faint: '#8A9099',
        },
        blue: {
          DEFAULT: '#0A9BF5',
          deep: '#0B5FA8',
          lite: '#5EC2FF',
        },
        stock: {
          ok: '#177E47',
          'ok-soft': '#E5F5E9',
          no: '#B3402F',
          'no-soft': '#F9E9E7',
        },
        line: {
          DEFAULT: 'rgba(14, 16, 19, 0.10)',
          soft: 'rgba(14, 16, 19, 0.05)',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque Variable', 'Georgia', 'serif'],
        sans: ['Geist Variable', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono Variable', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        tile: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 16, 19, 0.04)',
        lift: '0 10px 30px rgba(14, 16, 19, 0.08)',
        drawer: '0 12px 34px rgba(14, 16, 19, 0.24)',
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