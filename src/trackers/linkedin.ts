import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generatePageData,
} from '@/generators';
import { randomInt, randomChoice, generateUUID } from '@/utils/random';

export const linkedinInsight: TrackerDefinition = createTracker({
  id: 'linkedin',
  name: 'LinkedIn Insight Tag',
  patterns: [
    {
      domains: ['px.ads.linkedin.com', 'snap.licdn.com'],
      pathPatterns: [/\/collect/, /\/li\/track/, /\/px/],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      partnerId: extractUrlParam(url, 'pid') || extractUrlParam(url, 'partner_id'),
      conversionId: extractUrlParam(url, 'conversionId'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const page = generatePageData();

    const partnerId = match.parsedData.partnerId || randomInt(100000, 9999999).toString();

    const conversionTypes = ['page_view', 'conversion', 'signup', 'download', 'key_page_view'];
    const conversionType = randomChoice(conversionTypes);

    const params = new URLSearchParams({
      pid: partnerId,
      fmt: 'js',
      url: page.url,
      time: Date.now().toString(),
      event: conversionType,
      li_fat_id: generateUUID(),
    });

    // Add conversion-specific parameters
    if (conversionType === 'conversion') {
      params.set('conversionId', randomInt(1000000, 9999999).toString());
      if (Math.random() > 0.5) {
        params.set('value', randomInt(50, 500).toString());
        params.set('currency', randomChoice(['USD', 'EUR', 'GBP']));
      }
    }

    // Add device info
    params.set('sw', device.screenWidth.toString());
    params.set('sh', device.screenHeight.toString());
    params.set('cd', device.colorDepth.toString());

    return {
      url: `https://px.ads.linkedin.com/collect?${params.toString()}`,
      method: 'GET',
    };
  },
});
