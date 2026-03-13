import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7C3AED',
          'primary-light': '#A78BFA',
          'primary-dark': '#5B21B6',
          accent: '#F59E0B',
          'accent-light': '#FBBF24',
        },
        surface: {
          DEFAULT: '#1A1A1A',
          light: '#2A2A2A',
          card: '#111111',
          bg: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
