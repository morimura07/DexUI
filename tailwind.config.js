/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0B0E11',
        bg2:     '#1E2329',
        bg3:     '#2B3139',
        bg4:     '#363D45',
        yellow:  '#F0B90B',
        'yellow-d': '#c99a09',
        muted:   '#848E9C',
        green:   '#03A66D',
        red:     '#CF304A',
        border:  '#2B3139',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};