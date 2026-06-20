import { describe, it, expect } from 'vitest';
import { trackers, getTrackerById, getAllTrackerIds, getTrackerNames } from './index';
import { extractUrlParam, extractPathSegment } from './base-tracker';
import type { TrackerMatch, FloodConfig } from '@/types';

const FLOOD_CONFIG: FloodConfig = {
  minFakeRequests: 5,
  maxFakeRequests: 10,
  minDelayMs: 100,
  maxDelayMs: 500,
};

function makeFakeMatch(trackerId: string, url: string): TrackerMatch {
  const tracker = getTrackerById(trackerId)!;
  return {
    tracker,
    originalUrl: url,
    parsedData: tracker.parseOriginal(url, 'GET'),
    timestamp: Date.now(),
  };
}

describe('tracker registry', () => {
  it('has all expected trackers registered', () => {
    const ids = getAllTrackerIds();
    expect(ids).toContain('ga4');
    expect(ids).toContain('universal_analytics');
    expect(ids).toContain('fb_pixel');
    expect(ids).toContain('google_ads');
    expect(ids).toContain('criteo');
    expect(ids).toContain('tiktok');
    expect(ids).toContain('linkedin');
    expect(ids).toHaveLength(7);
  });

  it('getTrackerById returns the correct tracker', () => {
    const ga4 = getTrackerById('ga4');
    expect(ga4).toBeDefined();
    expect(ga4!.name).toBe('Google Analytics 4');
  });

  it('getTrackerById returns undefined for unknown id', () => {
    expect(getTrackerById('nonexistent')).toBeUndefined();
  });

  it('getTrackerNames returns id/name pairs', () => {
    const names = getTrackerNames();
    expect(names.length).toBe(7);
    expect(names.find((n) => n.id === 'ga4')!.name).toBe('Google Analytics 4');
  });

  it('every tracker has at least one pattern with domains and pathPatterns', () => {
    for (const tracker of trackers) {
      expect(tracker.patterns.length).toBeGreaterThanOrEqual(1);
      for (const pattern of tracker.patterns) {
        expect(pattern.domains.length).toBeGreaterThanOrEqual(1);
        expect(pattern.pathPatterns.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('base-tracker utilities', () => {
  it('extractUrlParam extracts query parameters', () => {
    expect(extractUrlParam('https://example.com?foo=bar&baz=qux', 'foo')).toBe('bar');
    expect(extractUrlParam('https://example.com?foo=bar', 'missing')).toBeUndefined();
  });

  it('extractUrlParam handles invalid URLs', () => {
    expect(extractUrlParam('not-a-url', 'foo')).toBeUndefined();
  });

  it('extractUrlParam returns undefined for empty param value', () => {
    expect(extractUrlParam('https://example.com?foo=', 'foo')).toBeUndefined();
  });

  it('extractPathSegment extracts path segments', () => {
    expect(extractPathSegment('https://example.com/a/b/c', 0)).toBe('a');
    expect(extractPathSegment('https://example.com/a/b/c', 2)).toBe('c');
    expect(extractPathSegment('https://example.com/a', 5)).toBeUndefined();
  });

  it('extractPathSegment handles invalid URLs', () => {
    expect(extractPathSegment('not-a-url', 0)).toBeUndefined();
  });
});

describe('fake request generation', () => {
  it('GA4 preserves the measurement ID and uses correct endpoint', () => {
    const match = makeFakeMatch(
      'ga4',
      'https://www.google-analytics.com/g/collect?tid=G-TEST123&cid=111.222'
    );

    for (let i = 0; i < 10; i++) {
      const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
      expect(req.url).toContain('google-analytics.com/g/collect');
      expect(req.url).toContain('tid=G-TEST123');
      expect(req.method).toBe('GET');

      const url = new URL(req.url);
      expect(url.searchParams.get('v')).toBe('2');
      expect(url.searchParams.get('cid')).toBeTruthy();
      expect(url.searchParams.get('en')).toBeTruthy();
      expect(url.searchParams.get('dl')).toBeTruthy();
      expect(url.searchParams.get('dt')).toBeTruthy();
    }
  });

  it('Universal Analytics preserves tracking ID and sets v=1', () => {
    const match = makeFakeMatch(
      'universal_analytics',
      'https://www.google-analytics.com/collect?tid=UA-12345-1&cid=555'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('google-analytics.com/collect');
    expect(req.url).toContain('tid=UA-12345-1');
    const url = new URL(req.url);
    expect(url.searchParams.get('v')).toBe('1');
    expect(url.searchParams.get('t')).toBeTruthy();
    expect(url.searchParams.get('cid')).toBeTruthy();
  });

  it('Facebook Pixel preserves pixel ID and includes fbp cookie', () => {
    const match = makeFakeMatch(
      'fb_pixel',
      'https://www.facebook.com/tr?id=9876543210&ev=PageView'
    );

    for (let i = 0; i < 10; i++) {
      const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
      expect(req.url).toContain('facebook.com/tr');
      expect(req.url).toContain('id=9876543210');
      expect(req.method).toBe('GET');

      const url = new URL(req.url);
      expect(url.searchParams.get('ev')).toBeTruthy();
      expect(url.searchParams.get('fbp')).toMatch(/^fb\.1\.\d+\.\d+$/);
    }
  });

  it('Google Ads preserves conversion ID and targets correct endpoint', () => {
    const match = makeFakeMatch(
      'google_ads',
      'https://www.googleadservices.com/pagead/conversion/AW-555?cv=AW-555&label=xyz'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('googleadservices.com/pagead/conversion/');
    expect(req.url).toContain('AW-555');
    expect(req.method).toBe('GET');

    const url = new URL(req.url);
    expect(url.searchParams.get('label')).toBeTruthy();
    expect(url.searchParams.get('url')).toBeTruthy();
  });

  it('Criteo includes account ID and event type', () => {
    const match = makeFakeMatch(
      'criteo',
      'https://sslwidget.criteo.com/events/track?a=12345'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('criteo.com');
    expect(req.method).toBe('GET');

    const url = new URL(req.url);
    expect(url.searchParams.get('a')).toBe('12345');
    expect(url.searchParams.get('p0')).toMatch(/^e=/);
  });

  it('TikTok Pixel includes pixel ID and structured context', () => {
    const match = makeFakeMatch(
      'tiktok',
      'https://analytics.tiktok.com/api/v2/pixel?pixel_code=TT123&event=PageView'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('analytics.tiktok.com');
    expect(req.method).toBe('GET');

    const url = new URL(req.url);
    expect(url.searchParams.get('sdkid')).toBe('TT123');
    expect(url.searchParams.get('event')).toBeTruthy();
    const context = JSON.parse(url.searchParams.get('context')!);
    expect(context.user_agent).toBeTruthy();
    expect(context.page.url).toBeTruthy();
  });

  it('LinkedIn Insight includes partner ID and device info', () => {
    const match = makeFakeMatch(
      'linkedin',
      'https://px.ads.linkedin.com/collect?pid=7654321'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('px.ads.linkedin.com');
    expect(req.method).toBe('GET');

    const url = new URL(req.url);
    expect(url.searchParams.get('pid')).toBe('7654321');
    expect(url.searchParams.get('event')).toBeTruthy();
    expect(url.searchParams.get('sw')).toBeTruthy();
    expect(url.searchParams.get('sh')).toBeTruthy();
  });

  it('every tracker generates a valid URL without errors', () => {
    for (const tracker of trackers) {
      const match: TrackerMatch = {
        tracker,
        originalUrl: 'https://example.com/test',
        parsedData: tracker.parseOriginal('https://example.com/test', 'GET'),
        timestamp: Date.now(),
      };

      for (let i = 0; i < 5; i++) {
        const req = tracker.generateFakeRequest(match, FLOOD_CONFIG);
        expect(req.url).toBeTruthy();
        expect(() => new URL(req.url)).not.toThrow();
        expect(['GET', 'POST', 'BEACON']).toContain(req.method);
      }
    }
  });

  it('generates varied data across multiple calls', () => {
    const match = makeFakeMatch(
      'ga4',
      'https://www.google-analytics.com/g/collect?tid=G-X'
    );

    const urls = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
      urls.add(req.url);
    }
    expect(urls.size).toBeGreaterThan(10);
  });
});
