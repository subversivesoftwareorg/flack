import type { TrackerDefinition } from '@/types';
import { googleAnalytics4, universalAnalytics } from './google-analytics';
import { facebookPixel } from './facebook-pixel';
import { googleAds } from './google-ads';
import { criteo } from './criteo';
import { tiktokPixel } from './tiktok';
import { linkedinInsight } from './linkedin';

export const trackers: TrackerDefinition[] = [
  googleAnalytics4,
  universalAnalytics,
  facebookPixel,
  googleAds,
  criteo,
  tiktokPixel,
  linkedinInsight,
];

export const trackerMap: Map<string, TrackerDefinition> = new Map(
  trackers.map((tracker) => [tracker.id, tracker])
);

export function getTrackerById(id: string): TrackerDefinition | undefined {
  return trackerMap.get(id);
}

export function getAllTrackerIds(): string[] {
  return trackers.map((t) => t.id);
}

export function getTrackerNames(): { id: string; name: string }[] {
  return trackers.map((t) => ({ id: t.id, name: t.name }));
}

export * from './base-tracker';
export { googleAnalytics4, universalAnalytics } from './google-analytics';
export { facebookPixel } from './facebook-pixel';
export { googleAds } from './google-ads';
export { criteo } from './criteo';
export { tiktokPixel } from './tiktok';
export { linkedinInsight } from './linkedin';
