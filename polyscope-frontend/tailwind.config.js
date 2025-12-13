/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#00d4ff',
          indigo: '#6366f1',
        },
        darkbg: '#0f0f1e',
        darkpanel: '#1a1a2e',
      }
    }
  },
  plugins: []
}
