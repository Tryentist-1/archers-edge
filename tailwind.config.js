/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'score-x': '#ff6b6b',      // Red for X (10)
        'score-10': '#4ecdc4',     // Teal for 10
        'score-9': '#45b7d1',      // Blue for 9
        'score-8': '#96ceb4',      // Green for 8
        'score-7': '#feca57',      // Yellow for 7
        'score-6': '#ff9ff3',      // Pink for 6
        'score-5': '#54a0ff',      // Light blue for 5
        'score-4': '#5f27cd',      // Purple for 4
        'score-3': '#00d2d3',      // Cyan for 3
        'score-2': '#ff9f43',      // Orange for 2
        'score-1': '#ee5a24',      // Dark orange for 1
        'score-m': '#2c3e50',      // Dark gray for M (miss)
        'score-empty': '#ecf0f1',  // Light gray for empty
      }
    },
  },
  plugins: [],
} 