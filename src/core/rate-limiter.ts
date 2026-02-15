interface RateLimitConfig {
  maxRequestsPerMinute: number;
  globalMaxPerMinute: number;
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(maxTokens: number, refillPeriodMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillPeriodMs;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  hasTokens(): boolean {
    this.refill();
    return this.tokens >= 1;
  }

  consume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  async waitForToken(): Promise<void> {
    while (!this.hasTokens()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export class RateLimiter {
  private trackerBuckets: Map<string, TokenBucket> = new Map();
  private globalBucket: TokenBucket;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.globalBucket = new TokenBucket(config.globalMaxPerMinute, 60000);
  }

  private getOrCreateBucket(trackerId: string): TokenBucket {
    let bucket = this.trackerBuckets.get(trackerId);
    if (!bucket) {
      bucket = new TokenBucket(this.config.maxRequestsPerMinute, 60000);
      this.trackerBuckets.set(trackerId, bucket);
    }
    return bucket;
  }

  canSend(trackerId: string): boolean {
    const bucket = this.getOrCreateBucket(trackerId);
    return bucket.hasTokens() && this.globalBucket.hasTokens();
  }

  consume(trackerId: string): boolean {
    if (!this.canSend(trackerId)) {
      return false;
    }

    const bucket = this.getOrCreateBucket(trackerId);
    bucket.consume();
    this.globalBucket.consume();
    return true;
  }

  async waitForSlot(trackerId: string): Promise<void> {
    const bucket = this.getOrCreateBucket(trackerId);
    await Promise.all([bucket.waitForToken(), this.globalBucket.waitForToken()]);
  }

  updateConfig(config: RateLimitConfig): void {
    this.config = config;
    this.globalBucket = new TokenBucket(config.globalMaxPerMinute, 60000);
    this.trackerBuckets.clear();
  }
}
