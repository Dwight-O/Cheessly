import { describe, expect, it } from 'vitest';
import { createRng, hashString, mulberry32 } from './prng';

describe('prng', () => {
  it('is deterministic for the same seed', () => {
    const a = Array.from({ length: 10 }, mulberry32(42));
    const b = Array.from({ length: 10 }, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('differs between seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('produces floats in [0, 1)', () => {
    const next = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashes strings deterministically', () => {
    expect(hashString('2026-09-16')).toBe(hashString('2026-09-16'));
    expect(hashString('2026-09-16')).not.toBe(hashString('2026-09-17'));
  });

  it('int/range stay in bounds', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 500; i++) {
      expect(rng.int(5)).toBeGreaterThanOrEqual(0);
      expect(rng.int(5)).toBeLessThan(5);
      const r = rng.range(3, 6);
      expect(r).toBeGreaterThanOrEqual(3);
      expect(r).toBeLessThanOrEqual(6);
    }
  });

  it('shuffle keeps all elements and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const rng = createRng(99);
    const out = rng.shuffle(input);
    expect(out.slice().sort((a, b) => a - b)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('pick throws on an empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});
