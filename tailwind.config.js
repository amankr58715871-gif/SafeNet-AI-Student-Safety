/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff', 100: '#d9eaff', 200: '#bcd9ff', 300: '#8ec1ff',
          400: '#599dff', 500: '#2f7bf6', 600: '#1a5fe0', 700: '#1749b8',
          800: '#173e95', 900: '#193874', 950: '#0f2350',
        },
        accent: {
          50: '#eafff5', 100: '#cdffdf', 200: '#9fffc0', 300: '#5cf996',
          400: '#25e876', 500: '#07cf5b', 600: '#00a749', 700: '#00853c',
          800: '#056832', 900: '#07552c', 950: '#002e16',
        },
        success: { 50: '#ecfdf3', 100: '#d1fadf', 200: '#a6f4c5', 300: '#6ce9a6', 400: '#32d583', 500: '#12b76a', 600: '#039855', 700: '#027a48', 800: '#05603a', 900: '#054e31' },
        warning: { 50: '#fffaeb', 100: '#fff0c2', 200: '#ffe089', 300: '#ffc94a', 400: '#ffae00', 500: '#f29000', 600: '#d96f00', 700: '#b55000', 800: '#924000', 900: '#773800' },
        danger: { 50: '#fef3f2', 100: '#fee4e2', 200: '#fecdca', 300: '#fda29b', 400: '#f97066', 500: '#f04438', 600: '#d92d20', 700: '#b42318', 800: '#912018', 900: '#7a271a' },
        neutral: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
