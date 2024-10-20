/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      colors:{
        'poppy-red':'rgba(230, 57, 70, 1)',
        "tinted-cyan":'rgba(168,	218,	220)'
      }
    },
  },
  plugins: [],
} 