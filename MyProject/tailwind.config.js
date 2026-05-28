/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        panel: '#10182c',
        surface: '#151f36',
        border: '#283652',
        primary: '#00a85a',
        success: '#12cf7a',
        danger: '#f24d58',
        muted: '#8fa0bb',
      },
    },
  },
  plugins: [],
};
