import {
  applyMove,
  canCaptureKing,
  createGame,
  findKing,
  generateMoves,
  parseBoard,
  squareY,
} from '../engine';
import type { Board } from '../engine';
import { levelRules } from './types';
import type { LevelConfig } from './types';

export interface LevelValidation {
  ok: boolean;
  /** Reasons the level is unplayable. */
  problems: string[];
  /** Reasons the level is playable but poor, e.g. winnable in one move. */
  warnings: string[];
}

function countKings(board: Board, color: 'w' | 'b'): number {
  let count = 0;
  for (const piece of board.cells) {
    if (piece && piece.type === 'K' && piece.color === color) count++;
  }
  return count;
}

/**
 * Every level — hand-written or generated — must pass this before it is
 * handed to the player:
 *
 *  - exactly one king per side
 *  - a legal board size
 *  - no pawn already standing on its own promotion rank
 *  - the player has at least one legal move
 *  - at least one player move avoids losing the king on the enemy's reply
 */
export function validateLevel(level: LevelConfig): LevelValidation {
  const problems: string[] = [];
  const warnings: string[] = [];

  let board: Board;
  try {
    board = parseBoard(level.rows);
  } catch (error) {
    return {
      ok: false,
      problems: [error instanceof Error ? error.message : 'unparseable board'],
      warnings,
    };
  }

  if (board.width < 4 || board.width > 8 || board.height < 4 || board.height > 8) {
    problems.push(`board is ${board.width}x${board.height}; must be between 4x4 and 8x8`);
  }
  if (countKings(board, 'w') !== 1) problems.push('the player needs exactly one king');
  if (countKings(board, 'b') !== 1) problems.push('the enemy needs exactly one king');

  for (let square = 0; square < board.cells.length; square++) {
    const piece = board.cells[square];
    if (!piece || piece.type !== 'P') continue;
    const y = squareY(board, square);
    if (piece.color === 'w' && y === 0) problems.push('a player pawn starts on its promotion rank');
    if (piece.color === 'b' && y === board.height - 1) {
      problems.push('an enemy pawn starts on its promotion rank');
    }
  }

  if (problems.length > 0) return { ok: false, problems, warnings };

  const game = createGame(board, levelRules(level));
  const playerMoves = generateMoves(board, 'w');
  if (playerMoves.length === 0) problems.push('the player has no legal move');
  if (findKing(board, 'w') !== null && canCaptureKing(board, 'b')) {
    // Not fatal on its own: the player moves first and may escape or trade.
    warnings.push('the enemy already attacks the player king');
  }
  if (canCaptureKing(board, 'w')) warnings.push('the player can win on move 1');

  const survivable = playerMoves.some((move) => {
    const next = applyMove(game, move);
    if (next.status === 'player-win') return true;
    if (next.status !== 'playing') return false;
    return !canCaptureKing(next.board, 'b');
  });
  if (!survivable) problems.push('every player move loses the king immediately');

  return { ok: problems.length === 0, problems, warnings };
}

export function assertValidLevel(level: LevelConfig): LevelConfig {
  const result = validateLevel(level);
  if (!result.ok) {
    throw new Error(`level ${level.index} is invalid: ${result.problems.join('; ')}`);
  }
  return level;
}
