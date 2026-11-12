/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: ['lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        bg: '#111111', sb: '#181818', cd: '#1E1E1E', ip: '#252525',
        pr: '#DC2626', ph: '#B91C1C', tx: '#F9FAFB', mu: '#9CA3AF', bd: '#333333',
      },
    },
  },
  plugins: [],
};
