import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  modules: ['@wxt-dev/module-vue'],

  manifest: ({ browser }) => ({
    name: 'Flack - Tracking Data Poisoner',
    description: 'Floods tracking services with fake data to protect your privacy',
    version: '1.0.0',

    permissions: ['storage', 'webRequest'],

    host_permissions: [
      // Google Analytics
      'https://*.google-analytics.com/*',
      'https://analytics.google.com/*',
      // Facebook
      'https://www.facebook.com/tr*',
      'https://connect.facebook.net/*',
      // Google Ads
      'https://googleads.g.doubleclick.net/*',
      'https://www.googleadservices.com/*',
      'https://pagead2.googlesyndication.com/*',
      // Criteo
      'https://*.criteo.com/*',
      'https://*.criteo.net/*',
      // TikTok
      'https://analytics.tiktok.com/*',
      // LinkedIn
      'https://px.ads.linkedin.com/*',
      // Twitter/X
      'https://analytics.twitter.com/*',
    ],

    // Firefox-specific settings
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'flack@privacy.extension',
          strict_min_version: '109.0',
        },
      },
    }),
  }),

  vite: () => ({
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }),
});
