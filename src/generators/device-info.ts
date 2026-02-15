import { weightedRandom, randomChoice, type WeightedItem } from '@/utils/random';

export interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  colorDepth: number;
  pixelRatio: number;
  timezone: string;
  language: string;
}

interface ScreenResolution {
  width: number;
  height: number;
}

const DESKTOP_RESOLUTIONS: WeightedItem<ScreenResolution>[] = [
  { value: { width: 1920, height: 1080 }, weight: 0.35 },
  { value: { width: 1366, height: 768 }, weight: 0.15 },
  { value: { width: 2560, height: 1440 }, weight: 0.12 },
  { value: { width: 1440, height: 900 }, weight: 0.10 },
  { value: { width: 1536, height: 864 }, weight: 0.08 },
  { value: { width: 1680, height: 1050 }, weight: 0.06 },
  { value: { width: 1280, height: 720 }, weight: 0.05 },
  { value: { width: 3840, height: 2160 }, weight: 0.05 },
  { value: { width: 2560, height: 1600 }, weight: 0.04 },
];

const MOBILE_RESOLUTIONS: WeightedItem<ScreenResolution>[] = [
  { value: { width: 390, height: 844 }, weight: 0.20 },  // iPhone 12/13/14
  { value: { width: 414, height: 896 }, weight: 0.15 },  // iPhone 11 Pro Max
  { value: { width: 393, height: 852 }, weight: 0.15 },  // iPhone 14 Pro
  { value: { width: 360, height: 800 }, weight: 0.15 },  // Common Android
  { value: { width: 412, height: 915 }, weight: 0.10 },  // Pixel 7
  { value: { width: 428, height: 926 }, weight: 0.10 },  // iPhone 14 Plus
  { value: { width: 375, height: 812 }, weight: 0.08 },  // iPhone X/XS
  { value: { width: 320, height: 568 }, weight: 0.07 },  // iPhone SE
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'America/Toronto',
  'America/Sao_Paulo',
];

const LANGUAGE_WEIGHTS: WeightedItem<string>[] = [
  { value: 'en-US', weight: 0.45 },
  { value: 'en-GB', weight: 0.08 },
  { value: 'de-DE', weight: 0.07 },
  { value: 'fr-FR', weight: 0.06 },
  { value: 'es-ES', weight: 0.05 },
  { value: 'es-MX', weight: 0.04 },
  { value: 'pt-BR', weight: 0.04 },
  { value: 'ja-JP', weight: 0.04 },
  { value: 'zh-CN', weight: 0.04 },
  { value: 'it-IT', weight: 0.03 },
  { value: 'ko-KR', weight: 0.03 },
  { value: 'en-CA', weight: 0.03 },
  { value: 'en-AU', weight: 0.02 },
  { value: 'nl-NL', weight: 0.02 },
];

export function generateDeviceInfo(isMobile: boolean = false): DeviceInfo {
  const screen = isMobile
    ? weightedRandom(MOBILE_RESOLUTIONS)
    : weightedRandom(DESKTOP_RESOLUTIONS);

  const viewportReduction = isMobile ? 0 : Math.floor(Math.random() * 200);

  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: screen.width - viewportReduction,
    viewportHeight: screen.height - (isMobile ? 0 : Math.floor(Math.random() * 150)),
    colorDepth: randomChoice([24, 30, 32]),
    pixelRatio: isMobile ? randomChoice([2, 3]) : randomChoice([1, 1.5, 2]),
    timezone: randomChoice(TIMEZONES),
    language: weightedRandom(LANGUAGE_WEIGHTS),
  };
}
