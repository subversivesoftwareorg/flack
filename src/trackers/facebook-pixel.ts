import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generateFbp,
  generatePageData,
  generateFBEvent,
} from '@/generators';
import { randomInt } from '@/utils/random';

export const facebookPixel: TrackerDefinition = createTracker({
  id: 'fb_pixel',
  name: 'Facebook Pixel',
  patterns: [
    {
      domains: ['facebook.com', 'www.facebook.com'],
      pathPatterns: [/^\/tr\/?$/],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      pixelId: extractUrlParam(url, 'id'),
      eventName: extractUrlParam(url, 'ev'),
      pageUrl: extractUrlParam(url, 'dl'),
      referrer: extractUrlParam(url, 'rl'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const fbp = generateFbp();
    const page = generatePageData();
    const event = generateFBEvent();

    const pixelId = match.parsedData.pixelId || '1234567890123456';

    const params = new URLSearchParams({
      id: pixelId,
      ev: event.ev,
      dl: page.url,
      rl: page.referrer,
      if: 'false',
      ts: Date.now().toString(),
      sw: device.screenWidth.toString(),
      sh: device.screenHeight.toString(),
      v: '2.9.159',
      r: 'stable',
      ec: randomInt(0, 3).toString(),
      o: randomInt(1, 30).toString(),
      fbp: fbp,
      it: Date.now().toString(),
      coo: 'false',
      rqm: 'GET',
    });

    // Add event custom data
    const customData: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(event.params)) {
      if (value !== undefined && value !== '') {
        customData[key] = value;
      }
    }

    if (Object.keys(customData).length > 0) {
      params.set('cd', JSON.stringify(customData));
    }

    return {
      url: `https://www.facebook.com/tr?${params.toString()}`,
      method: 'GET',
    };
  },
});
