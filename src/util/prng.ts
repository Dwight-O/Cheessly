/**
 * Seeded pseudo-random number generation.
 *
 * Every random decision in the game (level generation, AI mistakes, random
 * fallback moves) goes through one of these so a given seed always produces
 * the same game. No use of Math.random anywhere outside this file.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Integer in [min, max] inclusive. */
  range(min: number, max: number): number;
  /** Random element; throws on an empty array. */
  pick<T>(items: readonly T[]): T;
  /** Returns a new shuffled copy (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** True with the given probability (0..1). */
  chance(probability: number): boolean;
}

/** mulberry32: small, fast, good enough for a game. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit hash of a string (FNV-1a), for turning seeds like
 *  "2026-09-16" into a numeric seed. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  const next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  const rng: Rng = {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    range: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() called with an empty array');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    shuffle: (items) => {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const a = copy[i] as (typeof copy)[number];
        const b = copy[j] as (typeof copy)[number];
        copy[i] = b;
        copy[j] = a;
      }
      return copy;
    },
    chance: (probability) => next() < probability,
  };
  return rng;
}
