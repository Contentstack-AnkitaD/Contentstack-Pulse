/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          primary: "#6C5CE7",
          "primary-dark": "#5a4bd1",
          critical: "#e74c3c",
          warning: "#f39c12",
          healthy: "#27ae60",
        },
      },
    },
  },
  plugins: [],
};
