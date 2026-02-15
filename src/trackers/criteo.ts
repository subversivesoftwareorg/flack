import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generatePageData,
} from '@/generators';
import { randomInt, randomChoice, generateUUID } from '@/utils/random';

export const criteo: TrackerDefinition = createTracker({
  id: 'criteo',
  name: 'Criteo',
  patterns: [
    {
      domains: ['criteo.com', 'criteo.net'],
      pathPatterns: [/\/delivery\//, /\/events\//, /\/dis\//, /\/cdb/],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      accountId: extractUrlParam(url, 'a') || extractUrlParam(url, 'account'),
      siteType: extractUrlParam(url, 'st'),
      event: extractUrlParam(url, 'e'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const page = generatePageData();

    const accountId = match.parsedData.accountId || randomInt(10000, 99999).toString();

    const events = ['viewHome', 'viewItem', 'viewList', 'viewBasket', 'trackTransaction'];
    const event = randomChoice(events);

    const params = new URLSearchParams({
      a: accountId,
      v: '5.17.0',
      p0: 'e=' + event,
      p1: 'ci=' + generateUUID(),
      p2: 'dl=' + encodeURIComponent(page.url),
      p3: 'dt=' + encodeURIComponent(page.title),
      p4: 'dr=' + encodeURIComponent(page.referrer),
      p5: 'sw=' + device.screenWidth,
      p6: 'sh=' + device.screenHeight,
      p7: 'ww=' + device.viewportWidth,
      p8: 'wh=' + device.viewportHeight,
      tld: page.hostname,
      fu: page.url,
      ceid: generateUUID(),
      lsavail: '1',
    });

    // Add event-specific data
    if (event === 'viewItem' || event === 'viewList') {
      const productId = randomInt(10000, 99999);
      params.set('p9', `item=[${productId}]`);
      params.set('p10', `price=${randomInt(10, 500)}`);
    }

    if (event === 'trackTransaction') {
      params.set('p9', `id=TXN-${Date.now()}`);
      params.set('p10', `item=[${randomInt(10000, 99999)}]`);
      params.set('p11', `price=${randomInt(50, 1000)}`);
    }

    return {
      url: `https://sslwidget.criteo.com/event?${params.toString()}`,
      method: 'GET',
    };
  },
});
