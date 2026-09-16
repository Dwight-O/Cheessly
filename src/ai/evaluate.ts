import { generateMoves, opponent, PIECE_VALUE } from '../engine';
import type { Board, Color } from '../engine';

/** Score of a decisive position. Larger than any material total. */
export const MATE_SCORE = 100_000;

/** Each extra legal move is worth this much. Deliberately small: it breaks
 *  ties between equal-material positions without overriding material. */
export const MOBILITY_WEIGHT = 0.05;

export function materialScore(board: Board, me: Color): number {
  let score = 0;
  for (const piece of board.cells) {
    if (!piece) continue;
    score += (piece.color === me ? 1 : -1) * PIECE_VALUE[piece.type];
  }
  return score;
}

export function mobilityScore(board: Board, me: Color): number {
  return generateMoves(board, me).length - generateMoves(board, opponent(me)).length;
}

/** Static evaluation from `me`'s point of view: material plus a small
 *  mobility bonus. Higher is better for `me`. */
export function evaluate(board: Board, me: Color): number {
  return materialScore(board, me) + MOBILITY_WEIGHT * mobilityScore(board, me);
}
