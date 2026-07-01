/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1B2F",
        indigo: {
          50: "#F0F0FF",
          100: "#E4E3FF",
          200: "#C7C4FF",
          300: "#A29CFF",
          400: "#7C6FFF",
          500: "#5B4CF0",
          600: "#4634D6",
          700: "#3826AD",
          800: "#2C1D85",
          900: "#1F1360",
        },
        acid: "#C6F135",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};


