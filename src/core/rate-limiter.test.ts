import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the per-tracker limit', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 5,
      globalMaxPerMinute: 100,
    });

    for (let i = 0; i < 5; i++) {
      expect(limiter.canSend('ga4')).toBe(true);
      limiter.consume('ga4');
    }

    expect(limiter.canSend('ga4')).toBe(false);
  });

  it('tracks per-tracker limits independently', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 3,
      globalMaxPerMinute: 100,
    });

    for (let i = 0; i < 3; i++) {
      limiter.consume('ga4');
    }

    expect(limiter.canSend('ga4')).toBe(false);
    expect(limiter.canSend('fb_pixel')).toBe(true);
  });

  it('enforces the global rate limit', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 5,
    });

    for (let i = 0; i < 5; i++) {
      limiter.consume(`tracker-${i}`);
    }

    expect(limiter.canSend('tracker-new')).toBe(false);
  });

  it('refills tokens over time', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 5,
      globalMaxPerMinute: 100,
    });

    for (let i = 0; i < 5; i++) {
      limiter.consume('ga4');
    }
    expect(limiter.canSend('ga4')).toBe(false);

    vi.advanceTimersByTime(60000);

    expect(limiter.canSend('ga4')).toBe(true);
  });

  it('consume returns false when rate limited', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 1,
      globalMaxPerMinute: 100,
    });

    expect(limiter.consume('ga4')).toBe(true);
    expect(limiter.consume('ga4')).toBe(false);
  });

  it('updateConfig resets all buckets', () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 2,
      globalMaxPerMinute: 100,
    });

    limiter.consume('ga4');
    limiter.consume('ga4');
    expect(limiter.canSend('ga4')).toBe(false);

    limiter.updateConfig({
      maxRequestsPerMinute: 10,
      globalMaxPerMinute: 100,
    });

    expect(limiter.canSend('ga4')).toBe(true);
  });
});
