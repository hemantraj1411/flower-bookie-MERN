import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-72x72.png', 'icon-96x96.png', 'icon-128x128.png', 
                      'icon-144x144.png', 'icon-152x152.png', 'icon-192x192.png',
                      'icon-384x384.png', 'icon-512x512.png'],
      manifest: false, // Uses your public/manifest.json instead of generating one
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-url\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable PWA in development
        type: 'module'
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000', // Proxy API to your backend
      '/uploads': 'http://localhost:5000' // Proxy uploads to your backend
    }
  }
})