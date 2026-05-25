/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        panel: '#10182c',
        surface: '#151f36',
        border: '#283652',
        primary: '#27a8e9',
        success: '#12cf7a',
        danger: '#f24d58',
        muted: '#8fa0bb',
      },
    },
  },
  plugins: [],
};
