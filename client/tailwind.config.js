const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: [
    './pages/*',
    './components/*',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ["Roboto", ...defaultTheme.fontFamily.sans],
      mono: ["Roboto Mono", ...defaultTheme.fontFamily.mono],
    },
    fontWeight: {
      extralight: 100,
      light: 300,
      book: 400,
      semibold: 500,
      bold: 700,
      black: 900,
    },
    extend: {
      colors: {
        white: colors.white,
        black: colors.black,
        //
        gray: colors.coolGray,
        //
        red: colors.red,
        orange: colors.orange,
        yellow: colors.yellow,
        green: colors.green,
        teal: colors.teal,
        blue: colors.blue,
        indigo: colors.indigo,
        purple: colors.purple,
        pink: colors.pink,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
