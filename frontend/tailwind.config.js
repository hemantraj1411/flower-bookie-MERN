/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#ffe66d',
        flower: {
          light: '#fff5f5',
          dark: '#c92a2a',
        }
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'display': ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}