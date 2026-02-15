export interface FlackConfig {
  enabled: boolean;
  flood: {
    minFakeRequests: number;
    maxFakeRequests: number;
    minDelayMs: number;
    maxDelayMs: number;
  };
  rateLimit: {
    maxRequestsPerMinute: number;
    globalMaxPerMinute: number;
  };
  enabledTrackers: string[];
}

export const DEFAULT_CONFIG: FlackConfig = {
  enabled: true,
  flood: {
    minFakeRequests: 5,
    maxFakeRequests: 15,
    minDelayMs: 100,
    maxDelayMs: 2000,
  },
  rateLimit: {
    maxRequestsPerMinute: 30,
    globalMaxPerMinute: 100,
  },
  enabledTrackers: ['ga4', 'universal_analytics', 'fb_pixel', 'google_ads', 'criteo', 'tiktok', 'linkedin'],
};
