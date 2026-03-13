import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          // Paleta oficial Brandbook
          primary: '#1D45D8',       // Azul Brandly — Tecnologia
          'primary-light': '#4B6FE8', // Azul claro (hover/light variant)
          'primary-dark': '#1538A8',  // Azul escuro
          accent: '#00DFFF',        // Cyan/Verde Boreal — Dinamismo
          'accent-light': '#33E8FF', // Cyan claro
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          light: 'var(--color-surface-light)',
          card: 'var(--color-surface-card)',
          bg: 'var(--color-bg)',
        },
        themed: {
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          border: 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
