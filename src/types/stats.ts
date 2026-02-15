export interface FlackStats {
  trackersDetected: number;
  fakeRequestsSent: number;
  successfulRequests: number;
  failedRequests: number;
  byTracker: Record<string, number>;
  lastReset: number;
}

export const DEFAULT_STATS: FlackStats = {
  trackersDetected: 0,
  fakeRequestsSent: 0,
  successfulRequests: 0,
  failedRequests: 0,
  byTracker: {},
  lastReset: Date.now(),
};
