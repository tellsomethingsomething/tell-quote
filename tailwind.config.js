/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          navy: '#143642',
          teal: '#0F8B8D',
          orange: '#FE7F2D',
          // Tints for hover states and backgrounds
          'teal-light': '#12A3A5',
          'teal-dark': '#0D7577',
          'navy-light': '#1A4A5A',
          'orange-light': '#FF9A52',
        },
        // Dark theme base
        dark: {
          bg: '#0a0a0f',
          card: 'rgba(255, 255, 255, 0.02)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Light theme base
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
        // Section accent colors - updated to align with brand
        section: {
          productionCrew: '#0F8B8D',      // Brand Teal
          technicalCrew: '#143642',       // Brand Navy
          productionEquipment: '#06B6D4', // Cyan
          creative: '#FE7F2D',            // Brand Orange
          logistics: '#F59E0B',           // Amber
          expenses: '#10B981',            // Green
        },
        // Primary accent - now uses brand teal
        accent: {
          primary: '#0F8B8D',
          secondary: '#143642',
        },
      },
      fontFamily: {
        // Inter is a highly legible, modern sans-serif optimized for screens
        // with excellent number rendering for financial dashboards
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Mono for quote numbers and financial figures
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '10px',
        'input': '6px',
      },
    },
  },
  plugins: [],
}
