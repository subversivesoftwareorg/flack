import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestFlooder } from './request-flooder';
import type { TrackerMatch, FloodConfig } from '@/types';
import { getTrackerById } from '@/trackers';

const FLOOD_CONFIG: FloodConfig = {
  minFakeRequests: 3,
  maxFakeRequests: 3,
  minDelayMs: 0,
  maxDelayMs: 0,
};

function makeMatch(trackerId: string = 'ga4'): TrackerMatch {
  const tracker = getTrackerById(trackerId)!;
  return {
    tracker,
    originalUrl: 'https://www.google-analytics.com/g/collect?tid=G-TEST',
    parsedData: tracker.parseOriginal('https://www.google-analytics.com/g/collect?tid=G-TEST', 'GET'),
    timestamp: Date.now(),
  };
}

describe('RequestFlooder', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response()));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the expected number of fake requests', async () => {
    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 100,
    });

    const result = await flooder.flood(makeMatch(), FLOOD_CONFIG);

    expect(result.requestsSent).toBe(3);
    expect(result.successful).toBe(3);
    expect(result.failed).toBe(0);
  });

  it('counts failed requests correctly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 100,
    });

    const result = await flooder.flood(makeMatch(), FLOOD_CONFIG);

    expect(result.requestsSent).toBe(3);
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(3);
  });

  it('respects rate limits by skipping excess requests', async () => {
    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 1,
      globalMaxPerMinute: 100,
    });

    const config: FloodConfig = {
      minFakeRequests: 5,
      maxFakeRequests: 5,
      minDelayMs: 0,
      maxDelayMs: 0,
    };

    const result = await flooder.flood(makeMatch(), config);

    expect(result.requestsSent).toBeLessThanOrEqual(1);
  });

  it('respects global rate limit across trackers', async () => {
    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 2,
    });

    const result = await flooder.flood(makeMatch(), FLOOD_CONFIG);

    expect(result.requestsSent).toBeLessThanOrEqual(2);
  });

  it('calls fetch with no-cors mode and omitted credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 100,
    });

    const config: FloodConfig = { minFakeRequests: 1, maxFakeRequests: 1, minDelayMs: 0, maxDelayMs: 0 };
    await flooder.flood(makeMatch(), config);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.mode).toBe('no-cors');
    expect(options.credentials).toBe('omit');
  });

  it('updateRateLimitConfig takes effect on subsequent floods', async () => {
    const flooder = new RequestFlooder({
      maxRequestsPerMinute: 1,
      globalMaxPerMinute: 1,
    });

    const config: FloodConfig = { minFakeRequests: 3, maxFakeRequests: 3, minDelayMs: 0, maxDelayMs: 0 };
    const result1 = await flooder.flood(makeMatch(), config);
    expect(result1.requestsSent).toBeLessThanOrEqual(1);

    flooder.updateRateLimitConfig({
      maxRequestsPerMinute: 100,
      globalMaxPerMinute: 100,
    });

    const result2 = await flooder.flood(makeMatch(), config);
    expect(result2.requestsSent).toBe(3);
  });
});
