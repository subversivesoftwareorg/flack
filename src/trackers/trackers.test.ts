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
});

describe('base-tracker utilities', () => {
  it('extractUrlParam extracts query parameters', () => {
    expect(extractUrlParam('https://example.com?foo=bar&baz=qux', 'foo')).toBe('bar');
    expect(extractUrlParam('https://example.com?foo=bar', 'missing')).toBeUndefined();
  });

  it('extractUrlParam handles invalid URLs', () => {
    expect(extractUrlParam('not-a-url', 'foo')).toBeUndefined();
  });

  it('extractPathSegment extracts path segments', () => {
    expect(extractPathSegment('https://example.com/a/b/c', 0)).toBe('a');
    expect(extractPathSegment('https://example.com/a/b/c', 2)).toBe('c');
    expect(extractPathSegment('https://example.com/a', 5)).toBeUndefined();
  });
});

describe('fake request generation', () => {
  function makeFakeMatch(trackerId: string, url: string): TrackerMatch {
    const tracker = getTrackerById(trackerId)!;
    return {
      tracker,
      originalUrl: url,
      parsedData: tracker.parseOriginal(url, 'GET'),
      timestamp: Date.now(),
    };
  }

  it('GA4 generates valid fake requests', () => {
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
    }
  });

  it('Facebook Pixel generates valid fake requests', () => {
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
      expect(url.searchParams.get('fbp')).toBeTruthy();
    }
  });

  it('Universal Analytics generates valid fake requests', () => {
    const match = makeFakeMatch(
      'universal_analytics',
      'https://www.google-analytics.com/collect?tid=UA-12345-1&cid=555'
    );

    const req = match.tracker.generateFakeRequest(match, FLOOD_CONFIG);
    expect(req.url).toContain('google-analytics.com/collect');
    expect(req.url).toContain('tid=UA-12345-1');
    const url = new URL(req.url);
    expect(url.searchParams.get('v')).toBe('1');
  });

  it('every tracker can generate a fake request without errors', () => {
    for (const tracker of trackers) {
      const match: TrackerMatch = {
        tracker,
        originalUrl: 'https://example.com/test',
        parsedData: tracker.parseOriginal('https://example.com/test', 'GET'),
        timestamp: Date.now(),
      };

      expect(() => {
        const req = tracker.generateFakeRequest(match, FLOOD_CONFIG);
        expect(req.url).toBeTruthy();
        expect(['GET', 'POST', 'BEACON']).toContain(req.method);
      }).not.toThrow();
    }
  });
});
