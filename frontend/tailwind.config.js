/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151922",
        surface: "#f6f8fb",
        line: "#d8dee8",
        brand: "#176b87",
        mint: "#1f9d7a",
        amber: "#c78319",
        danger: "#c2414b"
      },
      boxShadow: {
        panel: "0 14px 38px rgba(21, 25, 34, 0.08)"
      }
    },
  },
  plugins: [],
};
