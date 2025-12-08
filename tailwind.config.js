/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // This is correct
  theme: {
    extend: {
      colors: {
        'background-light': '#f5f6fa',
        'background-dark': '#0d1117',
        'card-light': '#ffffff',
        'card-dark': '#1c2128',
        'text-primary-light': '#1f2937',
        'text-primary-dark': '#c9d1d9',
        'text-secondary-light': '#4b5563',
        'text-secondary-dark': '#8b949e',
        'border-light': '#e5e7eb',
        'border-dark': '#30363d',
        'primary': '#1f6feb',
      },
    },
  },
  plugins: [],
}
