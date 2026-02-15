import { storage } from '@wxt-dev/storage';
import { DEFAULT_STATS, type FlackStats } from '@/types';

export const statsStorage = storage.defineItem<FlackStats>('local:stats', {
  fallback: DEFAULT_STATS,
});

export async function getStats(): Promise<FlackStats> {
  return await statsStorage.getValue();
}

export async function incrementTrackerDetected(trackerId: string): Promise<void> {
  const stats = await getStats();
  stats.trackersDetected += 1;
  stats.byTracker[trackerId] = (stats.byTracker[trackerId] || 0) + 1;
  await statsStorage.setValue(stats);
}

export async function incrementFakeRequests(count: number, successful: number, failed: number): Promise<void> {
  const stats = await getStats();
  stats.fakeRequestsSent += count;
  stats.successfulRequests += successful;
  stats.failedRequests += failed;
  await statsStorage.setValue(stats);
}

export async function updateStats(
  trackerId: string,
  requestsSent: number,
  successful: number,
  failed: number
): Promise<void> {
  const stats = await getStats();
  stats.trackersDetected += 1;
  stats.fakeRequestsSent += requestsSent;
  stats.successfulRequests += successful;
  stats.failedRequests += failed;
  stats.byTracker[trackerId] = (stats.byTracker[trackerId] || 0) + 1;
  await statsStorage.setValue(stats);
}

export async function resetStats(): Promise<void> {
  await statsStorage.setValue({
    ...DEFAULT_STATS,
    lastReset: Date.now(),
  });
}
