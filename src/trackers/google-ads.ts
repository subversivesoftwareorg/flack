import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generateGA4ClientId,
  generatePageData,
} from '@/generators';
import { randomInt, randomChoice } from '@/utils/random';

export const googleAds: TrackerDefinition = createTracker({
  id: 'google_ads',
  name: 'Google Ads',
  patterns: [
    {
      domains: ['googleads.g.doubleclick.net', 'www.googleadservices.com', 'pagead2.googlesyndication.com'],
      pathPatterns: [/\/pagead\//, /\/conversion\//, /\/mads\//, /\/pcs\//],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      conversionId: extractUrlParam(url, 'id') || extractUrlParam(url, 'cv'),
      label: extractUrlParam(url, 'label'),
      value: extractUrlParam(url, 'value'),
      currency: extractUrlParam(url, 'currency_code'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const clientId = generateGA4ClientId();
    const page = generatePageData();

    const conversionId = match.parsedData.conversionId || 'AW-' + randomInt(100000000, 999999999);
    const label = match.parsedData.label || generateConversionLabel();

    const params = new URLSearchParams({
      cv: conversionId,
      label: label,
      random: randomInt(100000000, 999999999).toString(),
      url: page.url,
      ref: page.referrer || '',
      fst: Date.now().toString(),
      num: '1',
      bg: '!',
      guid: 'ON',
      resp: 'async_cc',
      eid: randomInt(100000, 999999).toString(),
      cid: clientId,
      auid: randomInt(100000000, 999999999).toString(),
      u_w: device.screenWidth.toString(),
      u_h: device.screenHeight.toString(),
      u_ah: (device.screenHeight - 40).toString(),
      u_aw: device.screenWidth.toString(),
      u_cd: device.colorDepth.toString(),
      u_his: randomInt(1, 50).toString(),
      u_tz: (new Date().getTimezoneOffset() * -1).toString(),
      u_nplug: randomInt(0, 5).toString(),
      frm: '0',
      tiba: page.title,
    });

    // Random chance to include conversion value
    if (Math.random() > 0.6) {
      const value = randomInt(10, 500);
      params.set('value', value.toString());
      params.set('currency_code', randomChoice(['USD', 'EUR', 'GBP']));
    }

    return {
      url: `https://www.googleadservices.com/pagead/conversion/${conversionId}/?${params.toString()}`,
      method: 'GET',
    };
  },
});

function generateConversionLabel(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let label = '';
  for (let i = 0; i < 17; i++) {
    label += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return label;
}
