import { findKing, pieceAt, withPiece } from './board';
import { findMove, hasLegalMove } from './moves';
import { opponent } from './types';
import type { Board, Color, GameRules, GameState, GameStatus, Move, Piece, Square } from './types';

export function createGame(board: Board, rules: GameRules = {}): GameState {
  const state: GameState = {
    board,
    turn: 'w',
    ply: 0,
    playerMoves: 0,
    enemyTurns: 0,
    extraEnemyMove: false,
    status: 'playing',
    rules,
    lastMove: null,
  };
  return { ...state, status: resolveStatus(state, null) };
}

/**
 * Applies a move and returns the next state. The move must be one produced by
 * the generator for the side to move; callers get those from
 * `generateMoves` / `findMove`.
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (state.status !== 'playing') throw new Error('applyMove: the game is already over');
  const mover = state.turn;
  const piece = pieceAt(state.board, move.from);
  if (!piece || piece.color !== mover) {
    throw new Error('applyMove: no piece of the side to move on the origin square');
  }

  const landing: Piece = move.promotion ? { type: move.promotion, color: mover } : piece;
  let board = withPiece(state.board, move.from, null);
  board = withPiece(board, move.to, landing);

  let turn: Color = opponent(mover);
  let enemyTurns = state.enemyTurns;
  let extraEnemyMove = state.extraEnemyMove;

  if (mover === 'b') {
    if (extraEnemyMove) {
      // This was the bonus move of a double-move turn.
      extraEnemyMove = false;
    } else {
      enemyTurns += 1;
      const every = state.rules.enemyDoubleMoveEvery;
      if (every && every > 0 && enemyTurns % every === 0) {
        extraEnemyMove = true;
        turn = 'b';
      }
    }
  }

  const next: GameState = {
    board,
    turn,
    ply: state.ply + 1,
    playerMoves: state.playerMoves + (mover === 'w' ? 1 : 0),
    enemyTurns,
    extraEnemyMove,
    status: 'playing',
    rules: state.rules,
    lastMove: move,
  };
  return { ...next, status: resolveStatus(next, move.captured === 'K' ? mover : null) };
}

/** Convenience wrapper for UI taps: resolves and applies a from/to pair. */
export function applyMoveBetween(state: GameState, from: Square, to: Square): GameState | null {
  const move = findMove(state.board, from, to, state.turn);
  return move ? applyMove(state, move) : null;
}

/**
 * Status precedence, in order:
 *  1. A king was just captured — decisive.
 *  2. A missing king (only reachable from a malformed level).
 *  3. The side to move has no legal move — that side loses.
 *  4. The player has used the move limit — draw (the level is replayed free).
 */
function resolveStatus(state: GameState, kingCapturedBy: Color | null): GameStatus {
  if (kingCapturedBy) return kingCapturedBy === 'w' ? 'player-win' : 'player-loss';
  if (findKing(state.board, 'w') === null) return 'player-loss';
  if (findKing(state.board, 'b') === null) return 'player-win';
  if (!hasLegalMove(state.board, state.turn)) {
    return state.turn === 'w' ? 'player-loss' : 'player-win';
  }
  const limit = state.rules.moveLimit;
  if (limit !== undefined && state.turn === 'w' && state.playerMoves >= limit) return 'draw';
  return 'playing';
}

/** Player moves remaining, or `null` when the level has no limit. */
export function movesLeft(state: GameState): number | null {
  const limit = state.rules.moveLimit;
  if (limit === undefined) return null;
  return Math.max(0, limit - state.playerMoves);
}

export function isOver(state: GameState): boolean {
  return state.status !== 'playing';
}
