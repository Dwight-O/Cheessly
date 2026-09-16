import type { PieceType } from '../engine';

/**
 * The difficulty curve, expressed as one function per lever so the hand-tuned
 * levels, the procedural generator and the tests all read from the same place.
 *
 * `f(levelIndex, seed) -> LevelConfig` is assembled from these in
 * `generator.ts`.
 */

export const BOSS_EVERY = 10;

export function isBoss(index: number): boolean {
  return index % BOSS_EVERY === 0;
}

/** 4x4 early, 8x8 late. */
export function boardSizeFor(index: number): number {
  if (index <= 8) return 4;
  if (index <= 16) return 5;
  if (index <= 28) return 6;
  if (index <= 40) return 7;
  return 8;
}

/** 0 means the random capture-preferring AI. Caps at 4 plies. */
export function aiDepthFor(index: number): number {
  if (index <= 3) return 0;
  return Math.min(4, 1 + Math.floor((index - 4) / 7));
}

/** 30% at level 1, falling to 0% by level 20. */
export function mistakeChanceFor(index: number): number {
  const progress = Math.min(1, (index - 1) / 19);
  return Math.round(0.3 * (1 - progress) * 100) / 100;
}

/** No limit until level 18, then tightening from 14 down to 5 moves. */
export function moveLimitFor(index: number): number | undefined {
  if (index < 18) return undefined;
  return Math.max(5, 14 - Math.floor((index - 18) / 4));
}

/** No timer until level 25, then 16s tightening to 10s. */
export function moveTimerFor(index: number): number | undefined {
  if (index < 25) return undefined;
  return Math.max(10, 16 - Math.floor((index - 25) / 5));
}

/** Blocked squares appear at level 12 and grow slowly. */
export function blockedCountFor(index: number): number {
  if (index < 12) return 0;
  return Math.min(6, 1 + Math.floor((index - 12) / 5));
}

/** The enemy double-move modifier is a late-boss twist. */
export function doubleMoveEveryFor(index: number): number | undefined {
  if (index < 20) return undefined;
  if (isBoss(index)) return 3;
  return index % 7 === 0 ? 4 : undefined;
}

/**
 * Material the generator may spend on enemy pieces, on top of the enemy king.
 * `allowance` carries the value of the player's meta upgrades so buying an
 * upgrade does not trivialise later levels.
 */
export function enemyBudgetFor(index: number, allowance = 0): number {
  const base = 1 + (index - 1) * 0.85;
  const boss = isBoss(index) ? 1.3 : 1;
  return Math.max(1, Math.round((base + allowance) * boss));
}

/** The player's army (excluding the king): strong early, thin late. */
export function playerArmyFor(index: number): PieceType[] {
  if (index <= 8) return ['Q'];
  if (index <= 14) return ['Q', 'N'];
  if (index <= 20) return ['R', 'N'];
  if (index <= 26) return ['N', 'P', 'P'];
  if (index <= 34) return ['N', 'P', 'P', 'P'];
  return ['P', 'P', 'P'];
}

/** What the enemy may buy at this level, cheapest first. Queens and rooks
 *  only show up once the player has something to answer them with. */
export function enemyPoolFor(index: number): PieceType[] {
  if (index <= 4) return ['P'];
  if (index <= 8) return ['P', 'N'];
  if (index <= 14) return ['P', 'N', 'B'];
  if (index <= 22) return ['P', 'N', 'B', 'R'];
  return ['P', 'N', 'B', 'R', 'Q'];
}
