/** Core rules types. This file (and the rest of /src/engine) is pure
 *  TypeScript: no React, no DOM, no randomness. */

/** `'w'` is the player, who always moves first. `'b'` is the enemy AI. */
export type Color = 'w' | 'b';

export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

export interface Piece {
  readonly type: PieceType;
  readonly color: Color;
}

/** A square index: `y * board.width + x`. `y = 0` is the enemy back rank. */
export type Square = number;

export interface Board {
  readonly width: number;
  readonly height: number;
  /** Length `width * height`; `null` where empty. */
  readonly cells: readonly (Piece | null)[];
  /** Length `width * height`; `true` where no piece may enter or pass through. */
  readonly blocked: readonly boolean[];
}

export interface Move {
  readonly from: Square;
  readonly to: Square;
  /** The moving piece's type *before* any promotion. */
  readonly piece: PieceType;
  /** The captured piece's type, if this move captures. */
  readonly captured?: PieceType;
  /** Set when a pawn reaches the far rank. Always `'Q'` in this game. */
  readonly promotion?: 'Q';
}

export type GameStatus = 'playing' | 'player-win' | 'player-loss' | 'draw';

export interface GameRules {
  /** Maximum number of *player* moves. Reaching it with both kings alive is a
   *  draw. Undefined means no limit. */
  readonly moveLimit?: number;
  /** The enemy takes two moves on every Nth enemy turn. Undefined means never. */
  readonly enemyDoubleMoveEvery?: number;
}

export interface GameState {
  readonly board: Board;
  readonly turn: Color;
  /** Half-moves played in total. */
  readonly ply: number;
  /** Player moves played, compared against `rules.moveLimit`. */
  readonly playerMoves: number;
  /** Completed enemy turns, used by the double-move modifier. */
  readonly enemyTurns: number;
  /** True while the enemy is taking the bonus move of a double-move turn. */
  readonly extraEnemyMove: boolean;
  readonly status: GameStatus;
  readonly rules: GameRules;
  readonly lastMove: Move | null;
}

export const PIECE_VALUE: Readonly<Record<PieceType, number>> = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 1000,
};

export const PIECE_NAME: Readonly<Record<PieceType, string>> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
  P: 'pawn',
};

export function opponent(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}
