import { inBounds, isBlocked, pieceAt, squareIndex, squareX, squareY } from './board';
import type { Board, Color, Move, Piece, PieceType, Square } from './types';

type Vector = readonly [number, number];

const ORTHOGONAL: readonly Vector[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DIAGONAL: readonly Vector[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const ALL_DIRECTIONS: readonly Vector[] = [...ORTHOGONAL, ...DIAGONAL];
const KNIGHT_JUMPS: readonly Vector[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

/** Player pawns move up the screen (toward y = 0); enemy pawns move down. */
export function pawnDirection(color: Color): number {
  return color === 'w' ? -1 : 1;
}

export function promotionRank(board: Board, color: Color): number {
  return color === 'w' ? 0 : board.height - 1;
}

function push(
  out: Move[],
  board: Board,
  from: Square,
  to: Square,
  piece: Piece,
  promote: boolean,
): void {
  const target = pieceAt(board, to);
  const move: Move = {
    from,
    to,
    piece: piece.type,
    ...(target ? { captured: target.type } : {}),
    ...(promote ? { promotion: 'Q' as const } : {}),
  };
  out.push(move);
}

function slide(out: Move[], board: Board, from: Square, piece: Piece, dirs: readonly Vector[]) {
  const x0 = squareX(board, from);
  const y0 = squareY(board, from);
  for (const [dx, dy] of dirs) {
    let x = x0 + dx;
    let y = y0 + dy;
    while (inBounds(board, x, y)) {
      const to = squareIndex(board, x, y);
      // A blocked square may be neither entered nor passed through.
      if (isBlocked(board, to)) break;
      const target = pieceAt(board, to);
      if (target && target.color === piece.color) break;
      push(out, board, from, to, piece, false);
      if (target) break; // captures end the ray
      x += dx;
      y += dy;
    }
  }
}

function step(out: Move[], board: Board, from: Square, piece: Piece, dirs: readonly Vector[]) {
  const x0 = squareX(board, from);
  const y0 = squareY(board, from);
  for (const [dx, dy] of dirs) {
    const x = x0 + dx;
    const y = y0 + dy;
    if (!inBounds(board, x, y)) continue;
    const to = squareIndex(board, x, y);
    if (isBlocked(board, to)) continue;
    const target = pieceAt(board, to);
    if (target && target.color === piece.color) continue;
    push(out, board, from, to, piece, false);
  }
}

function pawnMoves(out: Move[], board: Board, from: Square, piece: Piece) {
  const x0 = squareX(board, from);
  const y0 = squareY(board, from);
  const dy = pawnDirection(piece.color);
  const promoteRank = promotionRank(board, piece.color);

  // One square forward, only onto an empty, unblocked square. No double step.
  const fy = y0 + dy;
  if (inBounds(board, x0, fy)) {
    const to = squareIndex(board, x0, fy);
    if (!isBlocked(board, to) && !pieceAt(board, to)) {
      push(out, board, from, to, piece, fy === promoteRank);
    }
  }

  // Diagonal captures only.
  for (const dx of [-1, 1]) {
    const cx = x0 + dx;
    if (!inBounds(board, cx, fy)) continue;
    const to = squareIndex(board, cx, fy);
    if (isBlocked(board, to)) continue;
    const target = pieceAt(board, to);
    if (target && target.color !== piece.color) {
      push(out, board, from, to, piece, fy === promoteRank);
    }
  }
}

/** All moves for one piece. There are no pins or check rules, so every
 *  pseudo-legal move is legal. */
export function movesForPiece(board: Board, from: Square): Move[] {
  const piece = pieceAt(board, from);
  if (!piece) return [];
  const out: Move[] = [];
  switch (piece.type) {
    case 'K':
      step(out, board, from, piece, ALL_DIRECTIONS);
      break;
    case 'Q':
      slide(out, board, from, piece, ALL_DIRECTIONS);
      break;
    case 'R':
      slide(out, board, from, piece, ORTHOGONAL);
      break;
    case 'B':
      slide(out, board, from, piece, DIAGONAL);
      break;
    case 'N':
      // Knights jump, so a blocked square between origin and target is fine.
      step(out, board, from, piece, KNIGHT_JUMPS);
      break;
    case 'P':
      pawnMoves(out, board, from, piece);
      break;
  }
  return out;
}

/** Every legal move for `color`, in a deterministic order. */
export function generateMoves(board: Board, color: Color): Move[] {
  const out: Move[] = [];
  for (let square = 0; square < board.cells.length; square++) {
    const piece = board.cells[square];
    if (!piece || piece.color !== color) continue;
    out.push(...movesForPiece(board, square));
  }
  return out;
}

export function hasLegalMove(board: Board, color: Color): boolean {
  for (let square = 0; square < board.cells.length; square++) {
    const piece = board.cells[square];
    if (!piece || piece.color !== color) continue;
    if (movesForPiece(board, square).length > 0) return true;
  }
  return false;
}

/** Squares `color` could move onto next, used for threat hints and the level
 *  validator. */
export function attackedSquares(board: Board, color: Color): Set<Square> {
  const attacked = new Set<Square>();
  for (const move of generateMoves(board, color)) attacked.add(move.to);
  return attacked;
}

/** True if `color` can capture the opposing king on its next move. */
export function canCaptureKing(board: Board, color: Color): boolean {
  return generateMoves(board, color).some((move) => move.captured === 'K');
}

export function findMove(board: Board, from: Square, to: Square, color: Color): Move | undefined {
  const piece = pieceAt(board, from);
  if (!piece || piece.color !== color) return undefined;
  return movesForPiece(board, from).find((move) => move.to === to);
}

export function moveKey(move: Move): string {
  return `${move.from}-${move.to}${move.promotion ?? ''}`;
}

export const PIECE_TYPES: readonly PieceType[] = ['K', 'Q', 'R', 'B', 'N', 'P'];
