export interface TrackerPattern {
  domains: string[];
  pathPatterns: RegExp[];
  methods?: string[];
}

export interface TrackerDefinition {
  id: string;
  name: string;
  patterns: TrackerPattern[];
  parseOriginal: (url: string, method: string) => ParsedTrackingData;
  generateFakeRequest: (match: TrackerMatch, config: FloodConfig) => FakeRequest;
}

export interface ParsedTrackingData {
  trackerId?: string;
  clientId?: string;
  sessionId?: string;
  eventName?: string;
  pageUrl?: string;
  [key: string]: string | undefined;
}

export interface TrackerMatch {
  tracker: TrackerDefinition;
  originalUrl: string;
  parsedData: ParsedTrackingData;
  timestamp: number;
}

export interface FakeRequest {
  url: string;
  method: 'GET' | 'POST' | 'BEACON';
  body?: string;
  headers?: Record<string, string>;
}

export interface FloodConfig {
  minFakeRequests: number;
  maxFakeRequests: number;
  minDelayMs: number;
  maxDelayMs: number;
}

export interface FloodResult {
  requestsSent: number;
  successful: number;
  failed: number;
}
