
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'finder-blue': {
          100: '#E3F2FD',
          500: '#115CBA',
          600: '#115CBA',
          700: '#0E4A9A',
          800: '#0B3E7F',
        },
      },
    },
  },
  plugins: [],
}
