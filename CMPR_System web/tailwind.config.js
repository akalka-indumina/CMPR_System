/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: ['lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        bg: 'rgb(var(--pcms-bg) / <alpha-value>)',
        sb: 'rgb(var(--pcms-sb) / <alpha-value>)',
        cd: 'rgb(var(--pcms-cd) / <alpha-value>)',
        ip: 'rgb(var(--pcms-ip) / <alpha-value>)',
        pr: 'rgb(var(--pcms-pr) / <alpha-value>)',
        ph: 'rgb(var(--pcms-ph) / <alpha-value>)',
        tx: 'rgb(var(--pcms-tx) / <alpha-value>)',
        mu: 'rgb(var(--pcms-mu) / <alpha-value>)',
        bd: 'rgb(var(--pcms-bd) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
