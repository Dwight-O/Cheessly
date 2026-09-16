import { describe, expect, it } from 'vitest';
import { parseBoard, squareIndex } from './board';
import {
  attackedSquares,
  canCaptureKing,
  findMove,
  generateMoves,
  hasLegalMove,
  movesForPiece,
} from './moves';
import type { Board, Square } from './types';

const at = (board: Board, x: number, y: number): Square => squareIndex(board, x, y);
const targets = (board: Board, from: Square): Square[] =>
  movesForPiece(board, from)
    .map((m) => m.to)
    .sort((a, b) => a - b);

describe('king', () => {
  it('moves one square in all eight directions', () => {
    const board = parseBoard(['....', '.K..', '....', '....']);
    expect(targets(board, at(board, 1, 1))).toHaveLength(8);
  });

  it('is limited by the board edge', () => {
    const board = parseBoard(['K...', '....', '....', '....']);
    expect(targets(board, at(board, 0, 0))).toEqual(
      [at(board, 1, 0), at(board, 0, 1), at(board, 1, 1)].sort((a, b) => a - b),
    );
  });

  it('may move onto an attacked square (there is no check rule)', () => {
    const board = parseBoard(['..r.', '....', '....', '.K..']);
    const attacked = attackedSquares(board, 'b');
    const into = at(board, 2, 2);
    expect(attacked.has(into)).toBe(true);
    expect(targets(board, at(board, 1, 3))).toContain(into);
  });

  it('cannot capture its own pieces', () => {
    const board = parseBoard(['....', '.KP.', '....', '....']);
    expect(targets(board, at(board, 1, 1))).not.toContain(at(board, 2, 1));
  });
});

describe('sliding pieces', () => {
  it('queen covers all eight rays', () => {
    const board = parseBoard(['....', '.Q..', '....', '....']);
    expect(movesForPiece(board, at(board, 1, 1))).toHaveLength(11);
  });

  it('rook moves orthogonally only', () => {
    const board = parseBoard(['....', 'R...', '....', '....']);
    expect(movesForPiece(board, at(board, 0, 1))).toHaveLength(6);
  });

  it('bishop moves diagonally only', () => {
    const board = parseBoard(['....', '.B..', '....', '....']);
    expect(targets(board, at(board, 1, 1))).toEqual(
      [at(board, 0, 0), at(board, 2, 0), at(board, 0, 2), at(board, 2, 2), at(board, 3, 3)].sort(
        (a, b) => a - b,
      ),
    );
  });

  it('stops before a blocked square and cannot pass through it', () => {
    const board = parseBoard(['....', 'R#..', '....', '....']);
    expect(targets(board, at(board, 0, 1))).toEqual(
      [at(board, 0, 0), at(board, 0, 2), at(board, 0, 3)].sort((a, b) => a - b),
    );
  });

  it('captures end the ray', () => {
    const board = parseBoard(['....', 'R.p.', '....', '....']);
    const to = targets(board, at(board, 0, 1));
    expect(to).toContain(at(board, 2, 1));
    expect(to).not.toContain(at(board, 3, 1));
  });

  it('stops before a friendly piece', () => {
    const board = parseBoard(['....', 'R.P.', '....', '....']);
    const to = targets(board, at(board, 0, 1));
    expect(to).toContain(at(board, 1, 1));
    expect(to).not.toContain(at(board, 2, 1));
  });
});

describe('knight', () => {
  it('jumps over blocked squares and other pieces', () => {
    const board = parseBoard(['####', '#N##', '###.', '####']);
    expect(targets(board, at(board, 1, 1))).toEqual([at(board, 3, 2)]);
  });

  it('has the usual eight targets in open space', () => {
    const board = parseBoard([
      '........',
      '........',
      '........',
      '...N....',
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(movesForPiece(board, at(board, 3, 3))).toHaveLength(8);
  });

  it('cannot land on a blocked square or a friendly piece', () => {
    const board = parseBoard(['..#.', '....', '.P..', 'N...']);
    const to = targets(board, at(board, 0, 3));
    expect(to).not.toContain(at(board, 2, 0));
    expect(to).not.toContain(at(board, 1, 2));
    expect(to).toEqual([at(board, 1, 1), at(board, 2, 2)].sort((a, b) => a - b));
  });
});

describe('pawn', () => {
  it('moves one square forward only, never two', () => {
    const board = parseBoard(['....', '....', '....', '.P..']);
    expect(targets(board, at(board, 1, 3))).toEqual([at(board, 1, 2)]);
  });

  it('player pawns move up the board and enemy pawns move down', () => {
    const board = parseBoard(['....', '.p..', '....', '....']);
    expect(targets(board, at(board, 1, 1))).toEqual([at(board, 1, 2)]);
    const player = parseBoard(['....', '....', '.P..', '....']);
    expect(targets(player, at(player, 1, 2))).toEqual([at(player, 1, 1)]);
  });

  it('cannot capture straight ahead', () => {
    const board = parseBoard(['....', '....', '.n..', '.P..']);
    expect(movesForPiece(board, at(board, 1, 3))).toEqual([]);
  });

  it('captures diagonally forward', () => {
    const board = parseBoard(['....', '....', 'n.n.', '.P..']);
    expect(targets(board, at(board, 1, 3))).toEqual(
      [at(board, 0, 2), at(board, 1, 2), at(board, 2, 2)].sort((a, b) => a - b),
    );
  });

  it('cannot move onto a blocked square', () => {
    const board = parseBoard(['....', '.#..', '.P..', '....']);
    expect(movesForPiece(board, at(board, 1, 2))).toEqual([]);
  });

  it('is marked for promotion on reaching the far rank', () => {
    const board = parseBoard(['....', '.P..', '....', '....']);
    const move = movesForPiece(board, at(board, 1, 1))[0];
    expect(move?.promotion).toBe('Q');
  });

  it('promotes on a capture into the far rank too', () => {
    const board = parseBoard(['..r.', '.P..', '....', '....']);
    const capture = movesForPiece(board, at(board, 1, 1)).find((m) => m.captured === 'R');
    expect(capture?.promotion).toBe('Q');
  });

  it('does not promote before the far rank', () => {
    const board = parseBoard(['....', '....', '.P..', '....']);
    expect(movesForPiece(board, at(board, 1, 2))[0]?.promotion).toBeUndefined();
  });
});

describe('helpers', () => {
  it('generateMoves only returns moves for the given colour', () => {
    const board = parseBoard(['.k..', '....', '....', 'K...']);
    expect(generateMoves(board, 'w').every((m) => m.from === at(board, 0, 3))).toBe(true);
    expect(generateMoves(board, 'b').every((m) => m.from === at(board, 1, 0))).toBe(true);
  });

  it('hasLegalMove is false for a fully boxed-in side', () => {
    const board = parseBoard(['...k', '....', '##..', 'K#..']);
    expect(hasLegalMove(board, 'w')).toBe(false);
    expect(hasLegalMove(board, 'b')).toBe(true);
  });

  it('canCaptureKing sees a king capture one move away', () => {
    const board = parseBoard(['..k.', '....', '....', '..Q.']);
    expect(canCaptureKing(board, 'w')).toBe(true);
    expect(canCaptureKing(board, 'b')).toBe(false);
  });

  it('findMove resolves a from/to pair and rejects the wrong colour', () => {
    const board = parseBoard(['.k..', '....', '....', 'K...']);
    expect(findMove(board, at(board, 0, 3), at(board, 0, 2), 'w')).toBeDefined();
    expect(findMove(board, at(board, 0, 3), at(board, 2, 2), 'w')).toBeUndefined();
    expect(findMove(board, at(board, 0, 3), at(board, 0, 2), 'b')).toBeUndefined();
  });
});
