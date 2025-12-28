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
        // Marketing Design System
        marketing: {
          background: '#0A0A0B',
          surface: '#141416',
          border: '#2A2A2E',
          primary: '#6E44FF',      // Purple (darker end of gradient)
          accent: '#A881FF',       // Purple (lighter end of gradient)
          success: '#10B981',
          text: {
            primary: '#FAFAFA',
            secondary: '#A1A1AA'
          }
        },
        // Existing Brand colors (Updated to purple)
        brand: {
          primary: '#6E44FF',  // Primary brand color (purple) - used for buttons, links, selections
          navy: '#143642',
          teal: '#6E44FF',     // Kept for backwards compatibility, now purple
          orange: '#FE7F2D',
          // Tints for hover states and backgrounds
          'teal-light': '#8B6AFF',
          'teal-dark': '#5835CC',
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
          productionCrew: '#6E44FF',      // Brand Purple
          technicalCrew: '#143642',       // Brand Navy
          productionEquipment: '#06B6D4', // Cyan
          creative: '#FE7F2D',            // Brand Orange
          logistics: '#F59E0B',           // Amber
          expenses: '#10B981',            // Green
        },
        // Primary accent - now uses brand purple
        accent: {
          primary: '#6E44FF',
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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(110, 68, 255, 0.3), 0 0 10px rgba(168, 129, 255, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(110, 68, 255, 0.5), 0 0 25px rgba(168, 129, 255, 0.3)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        aurora: "aurora 60s linear infinite",
        glow: "glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      boxShadow: {
        'glow': '0 0 15px rgba(110, 68, 255, 0.4), 0 0 30px rgba(168, 129, 255, 0.2)',
        'glow-lg': '0 0 25px rgba(110, 68, 255, 0.5), 0 0 50px rgba(168, 129, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
