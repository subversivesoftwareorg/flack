import type { TrackerDefinition, TrackerMatch, FakeRequest, FloodConfig } from '@/types';
import { createTracker, extractUrlParam } from './base-tracker';
import {
  generateUserAgent,
  isMobileUserAgent,
  generateDeviceInfo,
  generateGA4ClientId,
  generateGAClientId,
  generateSessionId,
  generatePageData,
  generateGA4Event,
} from '@/generators';
import { randomInt } from '@/utils/random';

export const googleAnalytics4: TrackerDefinition = createTracker({
  id: 'ga4',
  name: 'Google Analytics 4',
  patterns: [
    {
      domains: ['google-analytics.com', 'analytics.google.com'],
      pathPatterns: [/\/g\/collect/, /\/mp\/collect/],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      measurementId: extractUrlParam(url, 'tid'),
      clientId: extractUrlParam(url, 'cid'),
      sessionId: extractUrlParam(url, 'sid'),
      eventName: extractUrlParam(url, 'en'),
      pageLocation: extractUrlParam(url, 'dl'),
      pageTitle: extractUrlParam(url, 'dt'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const clientId = generateGA4ClientId();
    const sessionId = generateSessionId();
    const page = generatePageData();
    const event = generateGA4Event();

    const measurementId = match.parsedData.measurementId || 'G-XXXXXXXXXX';

    const params = new URLSearchParams({
      v: '2',
      tid: measurementId,
      gtm: `45je4${randomInt(100, 999)}`,
      _p: randomInt(100000000, 999999999).toString(),
      cid: clientId,
      ul: device.language.toLowerCase(),
      sr: `${device.screenWidth}x${device.screenHeight}`,
      _fplc: '0',
      _s: '1',
      sid: sessionId,
      sct: randomInt(1, 20).toString(),
      seg: '1',
      dl: page.url,
      dr: page.referrer,
      dt: page.title,
      en: event.name,
      _ee: '1',
    });

    // Add event-specific parameters
    for (const [key, value] of Object.entries(event.params)) {
      if (value !== undefined && value !== '') {
        params.set(`ep.${key}`, String(value));
      }
    }

    return {
      url: `https://www.google-analytics.com/g/collect?${params.toString()}`,
      method: 'GET',
    };
  },
});

export const universalAnalytics: TrackerDefinition = createTracker({
  id: 'universal_analytics',
  name: 'Universal Analytics',
  patterns: [
    {
      domains: ['google-analytics.com'],
      pathPatterns: [/^\/collect$/],
      methods: ['GET', 'POST'],
    },
  ],

  parseOriginal(url: string): Record<string, string | undefined> {
    return {
      trackingId: extractUrlParam(url, 'tid'),
      clientId: extractUrlParam(url, 'cid'),
      hitType: extractUrlParam(url, 't'),
      pageUrl: extractUrlParam(url, 'dl'),
      pageTitle: extractUrlParam(url, 'dt'),
    };
  },

  generateFakeRequest(match: TrackerMatch, _config: FloodConfig): FakeRequest {
    const userAgent = generateUserAgent();
    const isMobile = isMobileUserAgent(userAgent);
    const device = generateDeviceInfo(isMobile);
    const clientId = generateGAClientId();
    const page = generatePageData();

    const trackingId = match.parsedData.trackingId || 'UA-XXXXXXXX-X';

    const hitTypes = ['pageview', 'event', 'social', 'timing'];
    const hitType = hitTypes[Math.floor(Math.random() * hitTypes.length)];

    const params = new URLSearchParams({
      v: '1',
      tid: trackingId,
      cid: clientId,
      t: hitType,
      dl: page.url,
      dt: page.title,
      dr: page.referrer,
      ul: device.language.toLowerCase(),
      sd: `${device.colorDepth}-bits`,
      sr: `${device.screenWidth}x${device.screenHeight}`,
      vp: `${device.viewportWidth}x${device.viewportHeight}`,
      je: '0',
      _gid: generateGAClientId(),
      z: randomInt(100000000, 999999999).toString(),
    });

    if (hitType === 'event') {
      params.set('ec', 'engagement');
      params.set('ea', 'click');
      params.set('el', `element-${randomInt(1, 100)}`);
    }

    return {
      url: `https://www.google-analytics.com/collect?${params.toString()}`,
      method: 'GET',
    };
  },
});
