import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        passport: '28px',
        soft: '18px'
      },
      boxShadow: {
        passport: '0 0 0 1.5px var(--ink) inset'
      }
    }
  },
  plugins: []
};

export default config;
