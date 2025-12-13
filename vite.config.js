import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Use /tell-quote/ for GitHub Pages, / for Vercel
  base: process.env.GITHUB_ACTIONS ? '/tell-quote/' : '/',

  build: {
    // Target modern browsers for better performance
    target: 'es2020',

    // Enable minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console.* in production
        drop_debugger: true,
      },
    },

    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],

          // State management
          'zustand-vendor': ['zustand'],

          // PDF library (large, separate chunk)
          'pdf-vendor': ['@react-pdf/renderer'],

          // Charts library
          'charts-vendor': ['recharts'],

          // Supabase client
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold

    // Source maps for debugging (optional in production)
    sourcemap: process.env.NODE_ENV !== 'production',
  },

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'recharts',
      '@supabase/supabase-js',
    ],
    // Exclude PDF renderer from pre-bundling (it's lazy loaded)
    exclude: ['@react-pdf/renderer'],
  },

  // Optional: Bundle analyzer (set ANALYZE=true to enable)
  ...(process.env.ANALYZE === 'true' && {
    build: {
      rollupOptions: {
        plugins: [
          // Uncomment if you install rollup-plugin-visualizer
          // import { visualizer } from 'rollup-plugin-visualizer'
          // visualizer({
          //   open: true,
          //   gzipSize: true,
          //   brotliSize: true,
          // }),
        ],
      },
    },
  }),
})
