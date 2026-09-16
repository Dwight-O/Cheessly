import type { Board, Color, Piece, PieceType, Square } from './types';

const PIECE_LETTERS = 'KQRBNP';

export function squareIndex(board: Board, x: number, y: number): Square {
  return y * board.width + x;
}

export function squareX(board: Board, square: Square): number {
  return square % board.width;
}

export function squareY(board: Board, square: Square): number {
  return Math.floor(square / board.width);
}

export function inBounds(board: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.width && y < board.height;
}

export function pieceAt(board: Board, square: Square): Piece | null {
  return board.cells[square] ?? null;
}

export function isBlocked(board: Board, square: Square): boolean {
  return board.blocked[square] === true;
}

export function createBoard(width: number, height: number): Board {
  const size = width * height;
  return {
    width,
    height,
    cells: new Array<Piece | null>(size).fill(null),
    blocked: new Array<boolean>(size).fill(false),
  };
}

/** Returns a copy with one square changed. Boards are at most 64 squares, so
 *  copying is cheaper than the bookkeeping an in-place undo would need. */
export function withPiece(board: Board, square: Square, piece: Piece | null): Board {
  const cells = board.cells.slice();
  cells[square] = piece;
  return { ...board, cells };
}

export function withBlocked(board: Board, squares: readonly Square[]): Board {
  const blocked = board.blocked.slice();
  for (const square of squares) blocked[square] = true;
  return { ...board, blocked };
}

export function findKing(board: Board, color: Color): Square | null {
  for (let i = 0; i < board.cells.length; i++) {
    const piece = board.cells[i];
    if (piece && piece.type === 'K' && piece.color === color) return i;
  }
  return null;
}

export function piecesOf(board: Board, color: Color): { square: Square; piece: Piece }[] {
  const found: { square: Square; piece: Piece }[] = [];
  for (let i = 0; i < board.cells.length; i++) {
    const piece = board.cells[i];
    if (piece && piece.color === color) found.push({ square: i, piece });
  }
  return found;
}

/**
 * Parses an ASCII board. One string per rank, top (enemy side) first.
 *
 * - `KQRBNP` uppercase: player pieces
 * - `kqrbnp` lowercase: enemy pieces
 * - `.` empty, `#` blocked
 *
 * Spaces are ignored so rows can be written as `'. . k .'` for readability.
 */
export function parseBoard(rows: readonly string[]): Board {
  const cleaned = rows.map((row) => row.replace(/\s/g, ''));
  const height = cleaned.length;
  if (height === 0) throw new Error('parseBoard: no rows');
  const width = (cleaned[0] as string).length;
  if (width === 0) throw new Error('parseBoard: empty row');
  const cells = new Array<Piece | null>(width * height).fill(null);
  const blocked = new Array<boolean>(width * height).fill(false);

  for (let y = 0; y < height; y++) {
    const row = cleaned[y] as string;
    if (row.length !== width) {
      throw new Error(`parseBoard: row ${y} has ${row.length} squares, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const ch = row[x] as string;
      const i = y * width + x;
      if (ch === '.') continue;
      if (ch === '#') {
        blocked[i] = true;
        continue;
      }
      const upper = ch.toUpperCase();
      if (!PIECE_LETTERS.includes(upper)) {
        throw new Error(`parseBoard: unknown symbol '${ch}' at (${x}, ${y})`);
      }
      cells[i] = { type: upper as PieceType, color: ch === upper ? 'w' : 'b' };
    }
  }
  return { width, height, cells, blocked };
}

/** Inverse of {@link parseBoard}; used by tests and the dev level preview. */
export function formatBoard(board: Board): string[] {
  const rows: string[] = [];
  for (let y = 0; y < board.height; y++) {
    let row = '';
    for (let x = 0; x < board.width; x++) {
      const i = y * board.width + x;
      const piece = board.cells[i];
      if (board.blocked[i]) row += '#';
      else if (!piece) row += '.';
      else row += piece.color === 'w' ? piece.type : piece.type.toLowerCase();
    }
    rows.push(row);
  }
  return rows;
}

/** Human-readable square name, e.g. `a1`. Used for ARIA labels. */
export function squareName(board: Board, square: Square): string {
  const x = squareX(board, square);
  const y = squareY(board, square);
  return `${String.fromCharCode(97 + x)}${board.height - y}`;
}
