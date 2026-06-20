import { describe, it, expect } from 'vitest';
import { randomInt, randomChoice, weightedRandom, generateUUID } from './random';

describe('randomInt', () => {
  it('returns values within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('handles equal min and max', () => {
    expect(randomInt(7, 7)).toBe(7);
  });
});

describe('randomChoice', () => {
  it('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomChoice(arr));
    }
  });
});

describe('weightedRandom', () => {
  it('returns values from the items list', () => {
    const items = [
      { value: 'common', weight: 0.9 },
      { value: 'rare', weight: 0.1 },
    ];
    for (let i = 0; i < 50; i++) {
      const val = weightedRandom(items);
      expect(['common', 'rare']).toContain(val);
    }
  });

  it('heavily favors high-weight items', () => {
    const items = [
      { value: 'always', weight: 1000 },
      { value: 'never', weight: 0.001 },
    ];
    const results = Array.from({ length: 200 }, () => weightedRandom(items));
    const alwaysCount = results.filter((r) => r === 'always').length;
    expect(alwaysCount).toBeGreaterThan(190);
  });
});

describe('generateUUID', () => {
  it('produces a valid v4 UUID format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique values', () => {
    const uuids = new Set(Array.from({ length: 50 }, () => generateUUID()));
    expect(uuids.size).toBe(50);
  });
});
