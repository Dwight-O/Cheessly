import { parseBoard, squareX, squareY } from '../engine';
import { generateLevel } from './generator';
import type { GeneratorOptions } from './generator';
import { HAND_TUNED_COUNT, HAND_TUNED_LEVELS } from './handTuned';
import type { LevelConfig } from './types';
import { validateLevel } from './validate';

export * from './types';
export * from './difficulty';
export { validateLevel, type LevelValidation } from './validate';
export { generateLevel, fallbackLevel, type GeneratorOptions } from './generator';
export { HAND_TUNED_COUNT, HAND_TUNED_LEVELS } from './handTuned';

/** Adds the meta-upgrade knight to a hand-tuned board, on the player's back
 *  rank if there is room, otherwise on the rank in front of it. */
function withExtraKnight(rows: readonly string[]): string[] {
  const board = parseBoard(rows);
  const grid = rows.map((row) => row.replace(/\s/g, '').split(''));
  for (const minY of [board.height - 1, board.height - 2]) {
    for (let square = board.cells.length - 1; square >= 0; square--) {
      const y = squareY(board, square);
      if (y !== minY) continue;
      if (board.cells[square] || board.blocked[square]) continue;
      const row = grid[y];
      if (row) row[squareX(board, square)] = 'N';
      return grid.map((cells) => cells.join(''));
    }
  }
  return grid.map((cells) => cells.join(''));
}

/**
 * The single entry point the game uses: hand-tuned data up to level 30, the
 * seeded generator beyond it. Meta upgrades are applied here so the rest of
 * the app never has to know about them.
 */
export function getLevel(index: number, seed: number, options: GeneratorOptions = {}): LevelConfig {
  if (index > HAND_TUNED_COUNT) return generateLevel(index, seed, options);

  const level = HAND_TUNED_LEVELS[Math.max(0, index - 1)] as LevelConfig;
  if (!options.extraKnight) return level;

  const upgraded: LevelConfig = { ...level, rows: withExtraKnight(level.rows) };
  // Never let an upgrade break a level: fall back to the original board.
  return validateLevel(upgraded).ok ? upgraded : level;
}

export function levelCount(): number {
  return HAND_TUNED_COUNT;
}
