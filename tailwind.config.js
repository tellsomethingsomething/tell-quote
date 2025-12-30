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
          primary: '#8B5CF6',      // Violet (start of gradient)
          accent: '#EC4899',       // Pink (end of gradient)
          success: '#10B981',
          text: {
            primary: '#FAFAFA',
            secondary: '#A1A1AA'
          }
        },
        // Brand colors - Purple to Pink gradient palette
        brand: {
          primary: '#8B5CF6',       // Violet-500 - Primary brand color (start of gradient)
          'primary-light': '#A78BFA', // Violet-400 - Lighter for hover states
          'primary-dark': '#7C3AED',  // Violet-600 - Darker for active states
          secondary: '#EC4899',     // Pink-500 - Secondary brand color (end of gradient)
          'secondary-light': '#F472B6', // Pink-400 - Lighter pink
          'secondary-dark': '#DB2777',  // Pink-600 - Darker pink
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
          productionCrew: '#8B5CF6',      // Violet (brand primary)
          technicalCrew: '#7C3AED',       // Darker violet
          productionEquipment: '#06B6D4', // Cyan
          creative: '#EC4899',            // Pink (brand secondary)
          logistics: '#F59E0B',           // Amber
          expenses: '#10B981',            // Green
        },
        // Primary accent - uses brand violet
        accent: {
          primary: '#8B5CF6',
          secondary: '#EC4899',
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
            boxShadow: '0 0 5px rgba(139, 92, 246, 0.3), 0 0 10px rgba(236, 72, 153, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 0 25px rgba(236, 72, 153, 0.3)',
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
        'glow': '0 0 15px rgba(139, 92, 246, 0.4), 0 0 30px rgba(236, 72, 153, 0.2)',
        'glow-lg': '0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(236, 72, 153, 0.3)',
      },
    },
  },
  plugins: [],
}
