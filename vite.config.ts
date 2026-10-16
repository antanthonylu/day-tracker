import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

// Deployed under https://<user>.github.io/day-tracker/ — every asset path must be
// relative to that subpath, so `base` is not '/'.
export default defineConfig({
  base: '/day-tracker/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'apple-touch-icon.png',
        'apple-touch-icon-precomposed.png',
        'apple-touch-icon-180.png',
        'apple-touch-icon-167.png',
        'apple-touch-icon-152.png',
        'favicon.svg',
      ],
      manifest: {
        name: 'Day Tracker',
        short_name: 'Day Tracker',
        description: 'A calendar-first habit tracker that lives on your phone.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#101215',
        theme_color: '#101215',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Everything the app needs is precached, so it runs with no network at all.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
