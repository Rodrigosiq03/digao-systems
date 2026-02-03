import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          DEFAULT: '#2B3A55',
          light: '#3C5178',
          dark: '#1B2436'
        },
        slateCustom: {
          950: '#0b0f17'
        }
      },
      boxShadow: {
        metal: '0 18px 55px rgba(0,0,0,.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
