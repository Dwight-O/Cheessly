import { describe, expect, it } from 'vitest';
import { parseBoard, PIECE_VALUE } from '../engine';
import type { PieceType } from '../engine';
import { boardSizeFor, enemyBudgetFor } from './difficulty';
import { fallbackLevel, generateLevel } from './generator';
import { getLevel } from './index';
import { validateLevel } from './validate';

function enemyMaterial(rows: readonly string[]): number {
  let total = 0;
  for (const row of rows) {
    for (const ch of row) {
      if (ch === ch.toUpperCase() || ch === '.' || ch === '#') continue;
      const type = ch.toUpperCase() as PieceType;
      if (type !== 'K') total += PIECE_VALUE[type];
    }
  }
  return total;
}

function enemyPieceCount(rows: readonly string[]): number {
  return rows
    .join('')
    .split('')
    .filter((ch) => /[qrbnp]/.test(ch)).length;
}

describe('generateLevel', () => {
  it('produces a valid level for every index and seed it is asked for', () => {
    for (const seed of [1, 2, 99, 123456]) {
      for (let index = 31; index <= 120; index++) {
        const level = generateLevel(index, seed);
        const result = validateLevel(level);
        expect(result.problems, `level ${index} seed ${seed}`).toEqual([]);
      }
    }
  });

  it('is deterministic for a seed and differs between seeds', () => {
    expect(generateLevel(42, 5)).toEqual(generateLevel(42, 5));
    const seeds = new Set([1, 2, 3, 4, 5].map((s) => generateLevel(42, s).rows.join('/')));
    expect(seeds.size).toBeGreaterThan(1);
  });

  it('grows the board with the level', () => {
    expect(parseBoard(generateLevel(31, 1).rows).width).toBe(boardSizeFor(31));
    expect(parseBoard(generateLevel(60, 1).rows).width).toBe(8);
  });

  it('spends the difficulty budget without overspending it', () => {
    for (const index of [31, 45, 60, 90]) {
      const level = generateLevel(index, 7);
      expect(enemyMaterial(level.rows)).toBeLessThanOrEqual(enemyBudgetFor(index));
    }
  });

  it('fields six or more enemy pieces deep in the ladder', () => {
    const counts = [60, 70, 80, 90].map((index) => enemyPieceCount(generateLevel(index, 3).rows));
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(6);
  });

  it('raises the enemy budget when the player has upgrades', () => {
    const plain = generateLevel(50, 11);
    const upgraded = generateLevel(50, 11, { budgetAllowance: 6 });
    expect(enemyMaterial(upgraded.rows)).toBeGreaterThan(enemyMaterial(plain.rows));
  });

  it('gives the player the extra knight when the upgrade is owned', () => {
    const upgraded = generateLevel(50, 11, { extraKnight: true });
    expect(upgraded.rows.join('')).toContain('N');
    expect(validateLevel(upgraded).ok).toBe(true);
  });

  it('never puts a pawn on its own promotion rank', () => {
    for (let index = 31; index <= 80; index++) {
      const rows = generateLevel(index, 4).rows;
      expect(rows[0]).not.toContain('P');
      expect(rows[rows.length - 1]).not.toContain('p');
    }
  });

  it('the fallback level is always valid', () => {
    for (const index of [31, 50, 70, 100]) {
      expect(validateLevel(fallbackLevel(index)).ok).toBe(true);
    }
  });
});

describe('getLevel', () => {
  it('returns hand-tuned data for levels 1-30', () => {
    expect(getLevel(1, 0).name).toBe('First Step');
    expect(getLevel(30, 0).isBoss).toBe(true);
  });

  it('generates levels past 30', () => {
    expect(validateLevel(getLevel(31, 1)).ok).toBe(true);
    expect(getLevel(31, 1)).toEqual(getLevel(31, 1));
  });

  it('adds the upgrade knight to a hand-tuned level without breaking it', () => {
    const plain = getLevel(12, 0);
    const upgraded = getLevel(12, 0, { extraKnight: true });
    const count = (rows: readonly string[]) => rows.join('').split('N').length - 1;
    expect(count(upgraded.rows)).toBe(count(plain.rows) + 1);
    expect(validateLevel(upgraded).ok).toBe(true);
  });
});
