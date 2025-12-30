import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Prompt user to update when new version available
      includeAssets: ['favicon.svg', 'productionos-logo.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ProductionOS - Production Management',
        short_name: 'ProductionOS',
        description: 'Multi-tenant SaaS platform for production companies - CRM, quoting, project management, and financial tools',
        theme_color: '#143642',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache strategies for different asset types
        runtimeCaching: [
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache font files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache API calls with stale-while-revalidate for better offline UX
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              backgroundSync: {
                name: 'api-sync-queue',
                options: {
                  maxRetentionTime: 60 * 24, // 24 hours
                },
              },
            },
          },
          {
            // Cache Supabase auth endpoints with network-first
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache static assets from CDNs
            urlPattern: /^https:\/\/cdn\..*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
        // Pre-cache important assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude large PDF vendor from precache (lazy loaded)
        globIgnores: ['**/pdf-vendor*.js'],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for new service worker
        skipWaiting: false,
        clientsClaim: true,
        // Offline fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
      },
      devOptions: {
        enabled: false, // Disable in dev mode
      },
    }),
  ],

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

          // DnD kit
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],

          // Date utilities
          'date-vendor': ['date-fns'],

          // Animations
          'motion-vendor': ['framer-motion'],
        },
      },
      plugins: [
        // Bundle visualizer - generates stats.html
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ].filter(Boolean),
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
      // Include @react-pdf/renderer and its CJS dependencies for proper ESM transformation
      '@react-pdf/renderer',
      'base64-js',
    ],
  },

  // Optional: Bundle analyzer (set ANALYZE=true to enable)
  // Usage: ANALYZE=true npm run build
})
