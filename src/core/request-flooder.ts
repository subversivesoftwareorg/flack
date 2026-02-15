import type { TrackerMatch, FakeRequest, FloodConfig, FloodResult } from '@/types';
import { RateLimiter } from './rate-limiter';
import { randomInt, sleep } from '@/utils/random';

interface RequestResult {
  success: boolean;
  timestamp: number;
  error?: string;
}

export class RequestFlooder {
  private rateLimiter: RateLimiter;

  constructor(rateLimitConfig: { maxRequestsPerMinute: number; globalMaxPerMinute: number }) {
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  updateRateLimitConfig(config: { maxRequestsPerMinute: number; globalMaxPerMinute: number }): void {
    this.rateLimiter.updateConfig(config);
  }

  async flood(match: TrackerMatch, config: FloodConfig): Promise<FloodResult> {
    const numRequests = randomInt(config.minFakeRequests, config.maxFakeRequests);
    const results: RequestResult[] = [];

    for (let i = 0; i < numRequests; i++) {
      // Check rate limit
      if (!this.rateLimiter.canSend(match.tracker.id)) {
        // Skip this request if rate limited
        continue;
      }

      // Generate and send fake request
      const fakeRequest = match.tracker.generateFakeRequest(match, config);
      const result = await this.sendFakeRequest(fakeRequest);
      results.push(result);

      // Consume rate limit token
      this.rateLimiter.consume(match.tracker.id);

      // Random delay before next request
      if (i < numRequests - 1) {
        const delay = randomInt(config.minDelayMs, config.maxDelayMs);
        await sleep(delay);
      }
    }

    return {
      requestsSent: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  private async sendFakeRequest(request: FakeRequest): Promise<RequestResult> {
    try {
      if (request.method === 'GET') {
        await fetch(request.url, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'omit',
          cache: 'no-store',
        });
      } else if (request.method === 'POST') {
        await fetch(request.url, {
          method: 'POST',
          mode: 'no-cors',
          credentials: 'omit',
          cache: 'no-store',
          body: request.body,
          headers: request.headers,
        });
      } else if (request.method === 'BEACON') {
        // sendBeacon is only available in window context, not service workers
        // Fall back to fetch in service worker
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(request.url, request.body);
        } else {
          await fetch(request.url, {
            method: 'POST',
            mode: 'no-cors',
            credentials: 'omit',
            body: request.body,
            keepalive: true,
          });
        }
      }

      return { success: true, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  }
}
