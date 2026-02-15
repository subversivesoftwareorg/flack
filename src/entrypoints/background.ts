import { defineBackground } from 'wxt/utils/define-background';
import { TrackerDetector, RequestFlooder } from '@/core';
import { getConfig, configStorage, updateStats } from '@/storage';
import type { FlackConfig } from '@/types';

export default defineBackground(() => {
  let detector: TrackerDetector;
  let flooder: RequestFlooder;
  let currentConfig: FlackConfig;

  // Initialize on startup
  async function initialize() {
    currentConfig = await getConfig();

    detector = new TrackerDetector(currentConfig.enabledTrackers);
    flooder = new RequestFlooder(currentConfig.rateLimit);

    console.log('[Flack] Background initialized', {
      enabled: currentConfig.enabled,
      trackers: currentConfig.enabledTrackers.length,
    });
  }

  // Listen for config changes
  configStorage.watch((newConfig) => {
    if (newConfig) {
      currentConfig = newConfig;
      detector.updateEnabledTrackers(newConfig.enabledTrackers);
      flooder.updateRateLimitConfig(newConfig.rateLimit);
      console.log('[Flack] Config updated', { enabled: newConfig.enabled });
    }
  });

  // Listen for completed web requests (observational, not blocking)
  browser.webRequest.onCompleted.addListener(
    async (details) => {
      // Skip if extension is disabled
      if (!currentConfig?.enabled) {
        return;
      }

      // Only process main frame and sub-resource requests
      if (details.type === 'main_frame') {
        return;
      }

      // Detect if this is a tracking request
      const match = detector.detect(details.url, details.method);

      if (match) {
        console.log('[Flack] Tracker detected:', match.tracker.name, details.url.substring(0, 80));

        // Flood with fake requests
        try {
          const result = await flooder.flood(match, currentConfig.flood);

          // Update statistics
          await updateStats(
            match.tracker.id,
            result.requestsSent,
            result.successful,
            result.failed
          );

          console.log('[Flack] Flood complete:', {
            tracker: match.tracker.name,
            sent: result.requestsSent,
            successful: result.successful,
          });
        } catch (error) {
          console.error('[Flack] Flood error:', error);
        }
      }
    },
    {
      urls: [
        // Google Analytics
        '*://*.google-analytics.com/*',
        '*://analytics.google.com/*',
        // Facebook
        '*://www.facebook.com/tr*',
        '*://connect.facebook.net/*',
        // Google Ads
        '*://googleads.g.doubleclick.net/*',
        '*://www.googleadservices.com/*',
        '*://pagead2.googlesyndication.com/*',
        // Criteo
        '*://*.criteo.com/*',
        '*://*.criteo.net/*',
        // TikTok
        '*://analytics.tiktok.com/*',
        // LinkedIn
        '*://px.ads.linkedin.com/*',
        // Twitter/X
        '*://analytics.twitter.com/*',
      ],
    }
  );

  // Handle messages from popup/options
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_STATUS') {
      sendResponse({
        enabled: currentConfig?.enabled ?? false,
        trackersCount: currentConfig?.enabledTrackers.length ?? 0,
      });
      return true;
    }

    if (message.type === 'TOGGLE_ENABLED') {
      const newEnabled = !currentConfig?.enabled;
      configStorage.setValue({ ...currentConfig, enabled: newEnabled }).then(() => {
        sendResponse({ enabled: newEnabled });
      });
      return true;
    }

    return false;
  });

  // Initialize immediately
  initialize();
});
