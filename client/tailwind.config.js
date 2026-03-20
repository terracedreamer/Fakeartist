/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: 'var(--canvas-bg)',
          text: 'var(--canvas-text)',
          accent: 'var(--canvas-accent)',
          card: 'var(--canvas-card)',
          border: 'var(--canvas-border)',
        },
      },
    },
  },
  plugins: [],
};
