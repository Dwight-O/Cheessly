import { PIECE_VALUE } from '../engine';
import type { PieceType } from '../engine';
import { createRng } from '../util/prng';
import type { Rng } from '../util/prng';
import {
  aiDepthFor,
  blockedCountFor,
  boardSizeFor,
  doubleMoveEveryFor,
  enemyBudgetFor,
  enemyPoolFor,
  isBoss,
  mistakeChanceFor,
  moveLimitFor,
  moveTimerFor,
  playerArmyFor,
} from './difficulty';
import type { LevelConfig } from './types';
import { validateLevel } from './validate';

export interface GeneratorOptions {
  /** Extra enemy material to offset the player's meta upgrades, so buying an
   *  upgrade does not trivialise the late ladder. */
  budgetAllowance?: number;
  /** The player starts with an extra knight (meta upgrade). */
  extraKnight?: boolean;
}

const MAX_ATTEMPTS = 40;

type Grid = string[][];

function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => '.'));
}

function freeSquares(grid: Grid, fromRow: number, toRow: number): [number, number][] {
  const free: [number, number][] = [];
  for (let y = fromRow; y <= toRow; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') free.push([x, y]);
    }
  }
  return free;
}

function place(grid: Grid, x: number, y: number, symbol: string): void {
  const row = grid[y];
  if (row) row[x] = symbol;
}

/** Spends the material budget on enemy pieces from the level's pool. */
function buyEnemyPieces(budget: number, index: number, rng: Rng, maxPieces: number): PieceType[] {
  const pool = enemyPoolFor(index);
  const bought: PieceType[] = [];
  let remaining = budget;
  const cheapest = Math.min(...pool.map((type) => PIECE_VALUE[type]));

  while (remaining >= cheapest && bought.length < maxPieces) {
    const affordable = pool.filter((type) => PIECE_VALUE[type] <= remaining);
    // Bias towards the strongest affordable piece half the time so late levels
    // actually field queens instead of a wall of pawns.
    const pick = rng.chance(0.5)
      ? (affordable[affordable.length - 1] as PieceType)
      : rng.pick(affordable);
    bought.push(pick);
    remaining -= PIECE_VALUE[pick];
  }
  return bought;
}

function buildRows(index: number, rng: Rng, options: GeneratorOptions): string[] {
  const size = boardSizeFor(index);
  const grid = emptyGrid(size);
  const enemyRows: [number, number] = [0, Math.max(0, Math.floor(size / 2) - 1)];
  const playerRows: [number, number] = [Math.floor(size / 2), size - 1];

  // Kings first: each on its own back rank.
  const enemyKingX = rng.int(size);
  const playerKingX = rng.int(size);
  place(grid, enemyKingX, 0, 'k');
  place(grid, playerKingX, size - 1, 'K');

  // Enemy army.
  const budget = enemyBudgetFor(index, options.budgetAllowance ?? 0);
  const pieces = buyEnemyPieces(budget, index, rng, size + 2);
  for (const type of pieces) {
    // Enemy pawns may not stand on the last rank (they would have promoted).
    const rows: [number, number] = type === 'P' ? [1, enemyRows[1]] : enemyRows;
    const options_ = freeSquares(grid, rows[0], rows[1]);
    if (options_.length === 0) break;
    const [x, y] = rng.pick(options_);
    place(grid, x, y, type.toLowerCase());
  }

  // Player army.
  const army = playerArmyFor(index);
  if (options.extraKnight) army.push('N');
  for (const type of army) {
    const rows: [number, number] =
      type === 'P' ? [playerRows[0], size - 2] : [playerRows[0], playerRows[1]];
    const spots = freeSquares(grid, rows[0], rows[1]);
    if (spots.length === 0) break;
    const [x, y] = rng.pick(spots);
    place(grid, x, y, type);
  }

  // Hazards last, never on a back rank so both kings keep room to move.
  const blocked = blockedCountFor(index);
  for (let i = 0; i < blocked; i++) {
    const spots = freeSquares(grid, 1, size - 2);
    if (spots.length === 0) break;
    const [x, y] = rng.pick(spots);
    place(grid, x, y, '#');
  }

  return grid.map((row) => row.join(''));
}

/** A guaranteed-valid level, used only if every generated attempt fails. */
export function fallbackLevel(index: number): LevelConfig {
  const size = boardSizeFor(index);
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    const row = Array.from({ length: size }, () => '.');
    if (y === 0) row[1] = 'k';
    if (y === 1) row[size - 2] = 'r';
    if (y === size - 1) {
      row[0] = 'K';
      row[2] = 'Q';
    }
    rows.push(row.join(''));
  }
  return { ...baseConfig(index), name: 'Ladder', rows };
}

function baseConfig(index: number): Omit<LevelConfig, 'rows' | 'name'> {
  const moveLimit = moveLimitFor(index);
  const moveTimerSeconds = moveTimerFor(index);
  const enemyDoubleMoveEvery = doubleMoveEveryFor(index);
  return {
    index,
    aiDepth: aiDepthFor(index),
    mistakeChance: mistakeChanceFor(index),
    isBoss: isBoss(index),
    ...(moveLimit !== undefined ? { moveLimit } : {}),
    ...(moveTimerSeconds !== undefined ? { moveTimerSeconds } : {}),
    ...(enemyDoubleMoveEvery !== undefined ? { enemyDoubleMoveEvery } : {}),
  };
}

const BOSS_NAMES = ['The Gauntlet', 'Iron Crown', 'Last Rank', 'The Siege', 'Endgame'];
const NAMES = [
  'Ascent',
  'Crossfire',
  'Thin Ice',
  'The Pinch',
  'Open Ground',
  'Skirmish',
  'The Ladder',
  'Hard Climb',
];

function nameFor(index: number, rng: Rng): string {
  return isBoss(index) ? rng.pick(BOSS_NAMES) : rng.pick(NAMES);
}

/**
 * `f(levelIndex, seed) -> LevelConfig` for levels past the hand-tuned set.
 *
 * Every candidate is validated; a candidate with warnings (winnable on move 1,
 * or the player starting under attack) is retried before being accepted, and a
 * fixed fallback covers the case where nothing valid turns up.
 */
export function generateLevel(
  index: number,
  seed: number,
  options: GeneratorOptions = {},
): LevelConfig {
  let warnedCandidate: LevelConfig | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = createRng(`${seed}:${index}:${attempt}`);
    const candidate: LevelConfig = {
      ...baseConfig(index),
      name: nameFor(index, rng),
      rows: buildRows(index, rng, options),
    };
    const result = validateLevel(candidate);
    if (!result.ok) continue;
    if (result.warnings.length === 0) return candidate;
    warnedCandidate ??= candidate;
  }

  return warnedCandidate ?? fallbackLevel(index);
}
