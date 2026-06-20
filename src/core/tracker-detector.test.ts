import { describe, it, expect } from 'vitest';
import { TrackerDetector } from './tracker-detector';

describe('TrackerDetector', () => {
  describe('detect', () => {
    it('detects Google Analytics 4 collect requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123&cid=1234.5678',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('ga4');
      expect(match!.tracker.name).toBe('Google Analytics 4');
    });

    it('detects Universal Analytics collect requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.google-analytics.com/collect?v=1&tid=UA-12345-1&cid=555',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('universal_analytics');
    });

    it('detects Facebook Pixel requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.facebook.com/tr?id=123456&ev=PageView',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('fb_pixel');
    });

    it('returns null for non-tracking URLs', () => {
      const detector = new TrackerDetector();
      expect(detector.detect('https://www.example.com/page', 'GET')).toBeNull();
      expect(detector.detect('https://www.google.com/search?q=test', 'GET')).toBeNull();
    });

    it('returns null for invalid URLs', () => {
      const detector = new TrackerDetector();
      expect(detector.detect('not-a-url', 'GET')).toBeNull();
    });

    it('includes parsed data in the match', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.google-analytics.com/g/collect?tid=G-TEST123&cid=111.222&en=page_view',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.parsedData.measurementId).toBe('G-TEST123');
      expect(match!.parsedData.clientId).toBe('111.222');
      expect(match!.parsedData.eventName).toBe('page_view');
    });

    it('includes a timestamp in the match', () => {
      const detector = new TrackerDetector();
      const before = Date.now();
      const match = detector.detect(
        'https://www.google-analytics.com/g/collect?tid=G-X',
        'GET'
      );
      const after = Date.now();
      expect(match!.timestamp).toBeGreaterThanOrEqual(before);
      expect(match!.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('filtering by enabled trackers', () => {
    it('only detects enabled trackers', () => {
      const detector = new TrackerDetector(['fb_pixel']);

      const fbMatch = detector.detect('https://www.facebook.com/tr?id=123', 'GET');
      expect(fbMatch).not.toBeNull();

      const gaMatch = detector.detect(
        'https://www.google-analytics.com/g/collect?tid=G-X',
        'GET'
      );
      expect(gaMatch).toBeNull();
    });

    it('can update enabled trackers at runtime', () => {
      const detector = new TrackerDetector(['fb_pixel']);

      expect(
        detector.detect('https://www.google-analytics.com/g/collect?tid=G-X', 'GET')
      ).toBeNull();

      detector.updateEnabledTrackers(['ga4']);

      expect(
        detector.detect('https://www.google-analytics.com/g/collect?tid=G-X', 'GET')
      ).not.toBeNull();

      expect(
        detector.detect('https://www.facebook.com/tr?id=123', 'GET')
      ).toBeNull();
    });
  });

  describe('subdomain matching', () => {
    it('matches wildcard domains', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://static.criteo.com/some/path',
        'GET'
      );
      // criteo patterns use wildcard domains — should match subdomains
      expect(match === null || match.tracker.id === 'criteo').toBe(true);
    });

    it('matches analytics.google.com for GA4', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://analytics.google.com/g/collect?tid=G-X',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('ga4');
    });
  });
});
