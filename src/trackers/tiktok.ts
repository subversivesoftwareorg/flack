import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generatePageData,
} from '@/generators';
import { randomInt, randomChoice, generateUUID } from '@/utils/random';

export const tiktokPixel: TrackerDefinition = createTracker({
  id: 'tiktok',
  name: 'TikTok Pixel',
  patterns: [
    {
      domains: ['analytics.tiktok.com'],
      pathPatterns: [/\/api\/v2\/pixel/, /\/track/, /\/pixel\//],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      pixelId: extractUrlParam(url, 'pixel_code') || extractUrlParam(url, 'sdkid'),
      event: extractUrlParam(url, 'event'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const page = generatePageData();

    const pixelId = match.parsedData.pixelId || generateTikTokPixelId();

    const events = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'PlaceAnOrder', 'CompleteRegistration'];
    const event = randomChoice(events);

    const timestamp = Date.now();

    const params = new URLSearchParams({
      sdkid: pixelId,
      event: event,
      event_id: generateUUID(),
      timestamp: timestamp.toString(),
      context: JSON.stringify({
        user_agent: userAgent,
        ip: '', // Don't send real IP
        page: {
          url: page.url,
          referrer: page.referrer,
        },
      }),
      properties: JSON.stringify(generateTikTokEventProperties(event, device)),
      partner_name: 'TikTok Pixel',
    });

    return {
      url: `https://analytics.tiktok.com/api/v2/pixel?${params.toString()}`,
      method: 'GET',
    };
  },
});

function generateTikTokPixelId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function generateTikTokEventProperties(event: string, device: { screenWidth: number; screenHeight: number }): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    '$screen_height': device.screenHeight,
    '$screen_width': device.screenWidth,
  };

  switch (event) {
    case 'ViewContent':
      properties['content_id'] = randomInt(10000, 99999).toString();
      properties['content_type'] = 'product';
      properties['content_name'] = 'Product ' + randomInt(1, 100);
      properties['value'] = randomInt(10, 500);
      properties['currency'] = 'USD';
      break;

    case 'AddToCart':
      properties['content_id'] = randomInt(10000, 99999).toString();
      properties['content_type'] = 'product';
      properties['quantity'] = randomInt(1, 3);
      properties['value'] = randomInt(10, 500);
      properties['currency'] = 'USD';
      break;

    case 'PlaceAnOrder':
      properties['content_id'] = randomInt(10000, 99999).toString();
      properties['content_type'] = 'product';
      properties['quantity'] = randomInt(1, 5);
      properties['value'] = randomInt(50, 1000);
      properties['currency'] = 'USD';
      break;

    case 'CompleteRegistration':
      properties['registration_method'] = randomChoice(['Email', 'Facebook', 'Google', 'Apple']);
      break;
  }

  return properties;
}
