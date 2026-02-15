import type { TrackerDefinition, TrackerPattern, ParsedTrackingData, TrackerMatch, FakeRequest, FloodConfig } from '@/types';

export function createTracker(config: {
  id: string;
  name: string;
  patterns: TrackerPattern[];
  parseOriginal: (url: string, method: string) => ParsedTrackingData;
  generateFakeRequest: (match: TrackerMatch, floodConfig: FloodConfig) => FakeRequest;
}): TrackerDefinition {
  return {
    id: config.id,
    name: config.name,
    patterns: config.patterns,
    parseOriginal: config.parseOriginal,
    generateFakeRequest: config.generateFakeRequest,
  };
}

export function extractUrlParam(url: string, param: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param) || undefined;
  } catch {
    return undefined;
  }
}

export function extractPathSegment(url: string, index: number): string | undefined {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    return segments[index];
  } catch {
    return undefined;
  }
}
