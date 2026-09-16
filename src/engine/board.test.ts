import { describe, expect, it } from 'vitest';
import { formatBoard, parseBoard, squareName, squareX, squareY } from './board';

describe('parseBoard', () => {
  it('reads case as colour and round-trips through formatBoard', () => {
    const rows = ['.k..', '..p.', '#...', 'K..Q'];
    const board = parseBoard(rows);
    expect(board.width).toBe(4);
    expect(board.height).toBe(4);
    expect(formatBoard(board)).toEqual(rows);
    expect(board.cells[1]).toEqual({ type: 'K', color: 'b' });
    expect(board.cells[12]).toEqual({ type: 'K', color: 'w' });
    expect(board.blocked[8]).toBe(true);
  });

  it('ignores spaces used for readability', () => {
    expect(formatBoard(parseBoard(['. k . .', 'K . . .']))).toEqual(['.k..', 'K...']);
  });

  it('supports non-square boards', () => {
    const board = parseBoard(['....k...', 'K.......']);
    expect(board.width).toBe(8);
    expect(board.height).toBe(2);
  });

  it('rejects ragged rows and unknown symbols', () => {
    expect(() => parseBoard(['....', '...'])).toThrow(/expected 4/);
    expect(() => parseBoard(['..x.'])).toThrow(/unknown symbol/);
    expect(() => parseBoard([])).toThrow();
  });
});

describe('coordinates', () => {
  it('maps indices to x/y with y = 0 at the enemy back rank', () => {
    const board = parseBoard(['....', '....', '....', '....']);
    expect(squareX(board, 6)).toBe(2);
    expect(squareY(board, 6)).toBe(1);
  });

  it('names squares like a chessboard for ARIA labels', () => {
    const board = parseBoard(['....', '....', '....', '....']);
    expect(squareName(board, 0)).toBe('a4');
    expect(squareName(board, 15)).toBe('d1');
  });
});
