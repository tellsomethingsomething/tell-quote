/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme base
        dark: {
          bg: '#0a0a0f',
          card: 'rgba(255, 255, 255, 0.02)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Section accent colors
        section: {
          productionCrew: '#3B82F6',     // Blue
          technicalCrew: '#8B5CF6',      // Purple
          productionEquipment: '#06B6D4', // Cyan
          creative: '#EC4899',            // Pink
          logistics: '#F59E0B',           // Amber
          expenses: '#10B981',            // Green
        },
        // Primary accent
        accent: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '10px',
        'input': '6px',
      },
    },
  },
  plugins: [],
}
