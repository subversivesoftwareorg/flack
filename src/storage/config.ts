import { storage } from '@wxt-dev/storage';
import { DEFAULT_CONFIG, type FlackConfig } from '@/types';

export const configStorage = storage.defineItem<FlackConfig>('local:config', {
  fallback: DEFAULT_CONFIG,
});

export async function getConfig(): Promise<FlackConfig> {
  return await configStorage.getValue();
}

export async function setConfig(config: Partial<FlackConfig>): Promise<void> {
  const current = await getConfig();
  await configStorage.setValue({ ...current, ...config });
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await setConfig({ enabled });
}

export async function setEnabledTrackers(trackerIds: string[]): Promise<void> {
  await setConfig({ enabledTrackers: trackerIds });
}

export async function setFloodConfig(floodConfig: FlackConfig['flood']): Promise<void> {
  await setConfig({ flood: floodConfig });
}

export async function setRateLimitConfig(rateLimitConfig: FlackConfig['rateLimit']): Promise<void> {
  await setConfig({ rateLimit: rateLimitConfig });
}

export async function resetConfig(): Promise<void> {
  await configStorage.setValue(DEFAULT_CONFIG);
}
