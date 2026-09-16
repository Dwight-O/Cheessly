import { generateMoves } from '../engine';
import type { Board, Color, Move } from '../engine';
import type { Rng } from '../util/prng';

/**
 * The level 1-3 AI, and the fallback used when a player's move timer expires:
 * a random legal move, preferring captures when any are available.
 */
export function randomMove(board: Board, color: Color, rng: Rng): Move | null {
  const moves = generateMoves(board, color);
  if (moves.length === 0) return null;
  const captures = moves.filter((move) => move.captured !== undefined);
  const pool = captures.length > 0 ? captures : moves;
  return rng.pick(pool);
}
