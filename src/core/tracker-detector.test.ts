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

    it('detects GA4 measurement protocol requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-X&api_secret=xyz',
        'POST'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('ga4');
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

    it('detects Google Ads conversion requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://www.googleadservices.com/pagead/conversion/AW-123456/?cv=AW-123456&label=abc',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('google_ads');
    });

    it('detects Google Ads doubleclick requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/123/',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('google_ads');
    });

    it('detects Criteo event requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://sslwidget.criteo.com/events/track?a=12345',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('criteo');
    });

    it('detects Criteo on subdomains', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://dis.eu.criteo.com/dis/rtb/appnexus/cookieMatch.aspx',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('criteo');
    });

    it('detects TikTok Pixel requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://analytics.tiktok.com/api/v2/pixel?sdkid=ABC123&event=PageView',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('tiktok');
    });

    it('detects LinkedIn Insight Tag requests', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://px.ads.linkedin.com/collect?pid=123456&fmt=js',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('linkedin');
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

  describe('parseOriginal', () => {
    const detector = new TrackerDetector();

    it('parses GA4 parameters', () => {
      const match = detector.detect(
        'https://www.google-analytics.com/g/collect?tid=G-TEST123&cid=111.222&en=page_view&dl=https://example.com&dt=My+Page',
        'GET'
      );
      expect(match!.parsedData.measurementId).toBe('G-TEST123');
      expect(match!.parsedData.clientId).toBe('111.222');
      expect(match!.parsedData.eventName).toBe('page_view');
      expect(match!.parsedData.pageLocation).toBe('https://example.com');
      expect(match!.parsedData.pageTitle).toBe('My Page');
    });

    it('parses Universal Analytics parameters', () => {
      const match = detector.detect(
        'https://www.google-analytics.com/collect?tid=UA-99999-1&cid=abc&t=event&dl=https://example.com&dt=Title',
        'GET'
      );
      expect(match!.parsedData.trackingId).toBe('UA-99999-1');
      expect(match!.parsedData.clientId).toBe('abc');
      expect(match!.parsedData.hitType).toBe('event');
    });

    it('parses Facebook Pixel parameters', () => {
      const match = detector.detect(
        'https://www.facebook.com/tr?id=9876543210&ev=Purchase&dl=https://shop.com&rl=https://google.com',
        'GET'
      );
      expect(match!.parsedData.pixelId).toBe('9876543210');
      expect(match!.parsedData.eventName).toBe('Purchase');
      expect(match!.parsedData.pageUrl).toBe('https://shop.com');
      expect(match!.parsedData.referrer).toBe('https://google.com');
    });

    it('parses Google Ads parameters', () => {
      const match = detector.detect(
        'https://www.googleadservices.com/pagead/conversion/AW-555?cv=AW-555&label=xyz&value=100&currency_code=USD',
        'GET'
      );
      expect(match!.parsedData.conversionId).toBe('AW-555');
      expect(match!.parsedData.label).toBe('xyz');
      expect(match!.parsedData.value).toBe('100');
      expect(match!.parsedData.currency).toBe('USD');
    });

    it('parses Criteo parameters', () => {
      const match = detector.detect(
        'https://sslwidget.criteo.com/events/track?a=12345&st=desktop&e=viewItem',
        'GET'
      );
      expect(match!.parsedData.accountId).toBe('12345');
      expect(match!.parsedData.siteType).toBe('desktop');
      expect(match!.parsedData.event).toBe('viewItem');
    });

    it('parses TikTok Pixel parameters', () => {
      const match = detector.detect(
        'https://analytics.tiktok.com/api/v2/pixel?pixel_code=TIKTOK123&event=AddToCart',
        'GET'
      );
      expect(match!.parsedData.pixelId).toBe('TIKTOK123');
      expect(match!.parsedData.event).toBe('AddToCart');
    });

    it('parses LinkedIn Insight parameters', () => {
      const match = detector.detect(
        'https://px.ads.linkedin.com/collect?pid=7654321&conversionId=999',
        'GET'
      );
      expect(match!.parsedData.partnerId).toBe('7654321');
      expect(match!.parsedData.conversionId).toBe('999');
    });
  });

  describe('filtering by enabled trackers', () => {
    it('only detects enabled trackers', () => {
      const detector = new TrackerDetector(['fb_pixel']);

      expect(detector.detect('https://www.facebook.com/tr?id=123', 'GET')).not.toBeNull();
      expect(
        detector.detect('https://www.google-analytics.com/g/collect?tid=G-X', 'GET')
      ).toBeNull();
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

    it('detects nothing when enabled list is empty', () => {
      const detector = new TrackerDetector([]);
      expect(
        detector.detect('https://www.google-analytics.com/g/collect?tid=G-X', 'GET')
      ).toBeNull();
      expect(
        detector.detect('https://www.facebook.com/tr?id=123', 'GET')
      ).toBeNull();
    });
  });

  describe('subdomain matching', () => {
    it('matches analytics.google.com for GA4', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://analytics.google.com/g/collect?tid=G-X',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('ga4');
    });

    it('matches pagead2.googlesyndication.com for Google Ads', () => {
      const detector = new TrackerDetector();
      const match = detector.detect(
        'https://pagead2.googlesyndication.com/pagead/gen_204',
        'GET'
      );
      expect(match).not.toBeNull();
      expect(match!.tracker.id).toBe('google_ads');
    });
  });
});
