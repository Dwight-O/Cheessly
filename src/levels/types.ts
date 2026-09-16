import { createGame, parseBoard } from '../engine';
import type { GameRules, GameState } from '../engine';

/**
 * A level is data, never code. The board is an ASCII diagram (see
 * `parseBoard`): uppercase = player, lowercase = enemy, `.` empty, `#` blocked.
 */
export interface LevelConfig {
  /** 1-based ladder position. */
  readonly index: number;
  readonly name: string;
  /** One string per rank, enemy back rank first. */
  readonly rows: readonly string[];
  /** 0 means "random legal move, preferring captures"; 1-4 is a minimax depth. */
  readonly aiDepth: number;
  /** Probability the AI throws a move away, 0-1. */
  readonly mistakeChance: number;
  /** Player moves allowed before the level is a draw. */
  readonly moveLimit?: number;
  /** Seconds per player move; expiry plays a random legal move. */
  readonly moveTimerSeconds?: number;
  /** The enemy moves twice on every Nth enemy turn. */
  readonly enemyDoubleMoveEvery?: number;
  readonly isBoss: boolean;
  /** Short line shown under the level title, e.g. a modifier warning. */
  readonly note?: string;
}

export function levelRules(level: LevelConfig): GameRules {
  return {
    ...(level.moveLimit !== undefined ? { moveLimit: level.moveLimit } : {}),
    ...(level.enemyDoubleMoveEvery !== undefined
      ? { enemyDoubleMoveEvery: level.enemyDoubleMoveEvery }
      : {}),
  };
}

export function levelToGame(level: LevelConfig): GameState {
  return createGame(parseBoard(level.rows), levelRules(level));
}
