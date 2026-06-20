import { describe, it, expect } from 'vitest';
import { generateUserAgent, isMobileUserAgent } from './user-agent';
import { generateDeviceInfo } from './device-info';
import {
  generateGAClientId,
  generateGA4ClientId,
  generateSessionId,
  generateFbp,
  generateFbc,
  generateSessionData,
} from './session';
import { generatePageData } from './page-data';
import { generateGA4Event, generateFBEvent } from './event-data';

describe('user-agent generator', () => {
  it('generates non-empty user agent strings', () => {
    for (let i = 0; i < 20; i++) {
      const ua = generateUserAgent();
      expect(ua).toBeTruthy();
      expect(ua.length).toBeGreaterThan(20);
    }
  });

  it('isMobileUserAgent correctly identifies mobile UAs', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X)')).toBe(true);
    expect(
      isMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    ).toBe(false);
  });
});

describe('device-info generator', () => {
  it('generates desktop device info with reasonable screen sizes', () => {
    const info = generateDeviceInfo(false);
    expect(info.screenWidth).toBeGreaterThanOrEqual(1280);
    expect(info.screenHeight).toBeGreaterThanOrEqual(720);
    expect(info.viewportWidth).toBeLessThanOrEqual(info.screenWidth);
    expect(info.viewportHeight).toBeLessThanOrEqual(info.screenHeight);
    expect([24, 30, 32]).toContain(info.colorDepth);
    expect(info.timezone).toBeTruthy();
    expect(info.language).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
  });

  it('generates mobile device info with smaller screens', () => {
    const info = generateDeviceInfo(true);
    expect(info.screenWidth).toBeLessThan(500);
    expect([2, 3]).toContain(info.pixelRatio);
  });
});

describe('session generators', () => {
  it('generateGAClientId matches GA format', () => {
    const id = generateGAClientId();
    expect(id).toMatch(/^GA1\.2\.\d+\.\d+$/);
  });

  it('generateGA4ClientId matches GA4 format', () => {
    const id = generateGA4ClientId();
    expect(id).toMatch(/^\d+\.\d+$/);
  });

  it('generateSessionId is a numeric string', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^\d+$/);
  });

  it('generateFbp matches fb cookie format', () => {
    const fbp = generateFbp();
    expect(fbp).toMatch(/^fb\.1\.\d+\.\d+$/);
  });

  it('generateFbc matches fb click format', () => {
    const fbc = generateFbc();
    expect(fbc).toMatch(/^fb\.1\.\d+\..+$/);
  });

  it('generateSessionData returns all fields', () => {
    const data = generateSessionData();
    expect(data.clientId).toBeTruthy();
    expect(data.sessionId).toBeTruthy();
    expect(data.userId).toBeTruthy();
    expect(data.fbp).toBeTruthy();
    expect(data.fbc).toBeTruthy();
    expect(data.sessionStart).toBeGreaterThan(0);
    expect(data.sessionCount).toBeGreaterThanOrEqual(1);
    expect(typeof data.engaged).toBe('boolean');
  });
});

describe('page-data generator', () => {
  it('generates valid page data', () => {
    for (let i = 0; i < 20; i++) {
      const page = generatePageData();
      expect(page.url).toMatch(/^https:\/\//);
      expect(page.title).toBeTruthy();
      expect(page.hostname).toBeTruthy();
      expect(page.path).toBeTruthy();
      expect(new URL(page.url)).toBeTruthy();
    }
  });
});

describe('event-data generators', () => {
  it('generateGA4Event returns valid event structure', () => {
    for (let i = 0; i < 30; i++) {
      const event = generateGA4Event();
      expect(event.name).toBeTruthy();
      expect(typeof event.params).toBe('object');
    }
  });

  it('generateGA4Event respects explicit event type', () => {
    const event = generateGA4Event('purchase');
    expect(event.name).toBe('purchase');
    expect(event.params.currency).toBeTruthy();
    expect(event.params.value).toBeGreaterThan(0);
    expect(event.params.transaction_id).toBeTruthy();
  });

  it('generateFBEvent returns valid event structure', () => {
    for (let i = 0; i < 30; i++) {
      const event = generateFBEvent();
      expect(event.ev).toBeTruthy();
      expect(typeof event.params).toBe('object');
    }
  });

  it('generateFBEvent respects explicit event type', () => {
    const event = generateFBEvent('Purchase');
    expect(event.ev).toBe('Purchase');
    expect(event.params.currency).toBeTruthy();
    expect(event.params.value).toBeGreaterThan(0);
  });
});
