import { randomInt, generateUUID } from '@/utils/random';

export interface SessionData {
  clientId: string;
  sessionId: string;
  userId: string;
  fbp: string;
  fbc: string;
  sessionStart: number;
  sessionCount: number;
  engaged: boolean;
}

export function generateGAClientId(): string {
  const random = Math.floor(Math.random() * 2147483647);
  const timestamp = Math.floor(Date.now() / 1000) - randomInt(0, 86400 * 30);
  return `GA1.2.${random}.${timestamp}`;
}

export function generateGA4ClientId(): string {
  const random = Math.floor(Math.random() * 2147483647);
  const timestamp = Math.floor(Date.now() / 1000) - randomInt(0, 86400 * 30);
  return `${random}.${timestamp}`;
}

export function generateSessionId(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function generateUserId(): string {
  return generateUUID();
}

export function generateFbp(): string {
  const version = 'fb';
  const subdomainIndex = '1';
  const creationTime = Date.now() - randomInt(0, 86400000 * 30);
  const randomId = Math.floor(Math.random() * 2147483647);
  return `${version}.${subdomainIndex}.${creationTime}.${randomId}`;
}

export function generateFbc(clickId?: string): string {
  if (!clickId) {
    clickId = generateRandomClickId();
  }
  const version = 'fb';
  const subdomainIndex = '1';
  const creationTime = Date.now() - randomInt(0, 3600000);
  return `${version}.${subdomainIndex}.${creationTime}.${clickId}`;
}

function generateRandomClickId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSessionData(): SessionData {
  return {
    clientId: generateGA4ClientId(),
    sessionId: generateSessionId(),
    userId: generateUserId(),
    fbp: generateFbp(),
    fbc: generateFbc(),
    sessionStart: Date.now() - randomInt(0, 1800000),
    sessionCount: randomInt(1, 50),
    engaged: Math.random() > 0.3,
  };
}
