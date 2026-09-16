import { describe, expect, it } from 'vitest';
import { parseBoard, pieceAt, squareIndex } from './board';
import { applyMove, applyMoveBetween, createGame, isOver, movesLeft } from './game';
import { generateMoves } from './moves';
import type { Board, GameRules, GameState, Square } from './types';

const at = (board: Board, x: number, y: number): Square => squareIndex(board, x, y);

function game(rows: string[], rules: GameRules = {}): GameState {
  return createGame(parseBoard(rows), rules);
}

/** Plays a from/to pair and fails loudly if it was not legal. */
function play(state: GameState, from: [number, number], to: [number, number]): GameState {
  const next = applyMoveBetween(
    state,
    at(state.board, from[0], from[1]),
    at(state.board, to[0], to[1]),
  );
  if (!next) throw new Error(`illegal move ${from.join(',')} -> ${to.join(',')}`);
  return next;
}

describe('createGame', () => {
  it('starts with the player to move', () => {
    expect(game(['.k..', '....', '....', 'K...']).turn).toBe('w');
  });

  it('is an immediate loss when the player has no legal move', () => {
    expect(game(['...k', '....', '##..', 'K#..']).status).toBe('player-loss');
  });

  it('is an immediate loss when the player king is missing', () => {
    expect(game(['.k..', '....', '....', 'Q...']).status).toBe('player-loss');
  });

  it('is an immediate win when the enemy king is missing', () => {
    expect(game(['.q..', '....', '....', 'K...']).status).toBe('player-win');
  });
});

describe('applyMove', () => {
  it('moves the piece and clears the origin square', () => {
    const start = game(['.k..', '....', '....', 'K...']);
    const next = play(start, [0, 3], [0, 2]);
    expect(pieceAt(next.board, at(next.board, 0, 3))).toBeNull();
    expect(pieceAt(next.board, at(next.board, 0, 2))).toEqual({ type: 'K', color: 'w' });
    expect(next.turn).toBe('b');
    expect(next.ply).toBe(1);
    expect(next.playerMoves).toBe(1);
  });

  it('promotes a pawn that reaches the far rank', () => {
    const start = game(['...k', '.P..', '....', 'K...']);
    const next = play(start, [1, 1], [1, 0]);
    expect(pieceAt(next.board, at(next.board, 1, 0))).toEqual({ type: 'Q', color: 'w' });
    expect(next.lastMove?.promotion).toBe('Q');
  });

  it('promotes an enemy pawn on the player back rank', () => {
    const start = game(['...k', '....', '.p..', 'K...']);
    const afterPlayer = play(start, [0, 3], [0, 2]);
    const promoted = play(afterPlayer, [1, 2], [1, 3]);
    expect(pieceAt(promoted.board, at(promoted.board, 1, 3))).toEqual({ type: 'Q', color: 'b' });
  });

  it('records the captured piece type', () => {
    const start = game(['..k.', '....', '..r.', 'K.Q.']);
    const next = play(start, [2, 3], [2, 2]);
    expect(next.lastMove?.captured).toBe('R');
  });

  it('rejects a move once the game is over', () => {
    const start = game(['..k.', '....', '....', 'K.Q.']);
    const won = play(start, [2, 3], [2, 0]);
    expect(won.status).toBe('player-win');
    expect(() => applyMove(won, won.lastMove!)).toThrow(/already over/);
  });

  it('rejects a move from a square the side to move does not occupy', () => {
    const start = game(['.k..', '....', '....', 'K...']);
    const enemyMove = generateMoves(start.board, 'b')[0]!;
    expect(() => applyMove(start, enemyMove)).toThrow(/origin square/);
  });

  it('applyMoveBetween returns null for an illegal pair', () => {
    const start = game(['.k..', '....', '....', 'K...']);
    expect(applyMoveBetween(start, at(start.board, 0, 3), at(start.board, 3, 0))).toBeNull();
  });
});

describe('win and loss', () => {
  it('capturing the enemy king wins', () => {
    const start = game(['..k.', '....', '....', 'K.Q.']);
    expect(play(start, [2, 3], [2, 0]).status).toBe('player-win');
  });

  it('losing the player king loses', () => {
    const start = game(['..k.', '.P..', '....', 'K..r']);
    const afterPlayer = play(start, [1, 1], [1, 0]);
    expect(afterPlayer.status).toBe('playing');
    const capture = generateMoves(afterPlayer.board, 'b').find((m) => m.captured === 'K');
    expect(capture).toBeDefined();
    expect(applyMove(afterPlayer, capture!).status).toBe('player-loss');
  });

  it('leaving the enemy with no legal move wins', () => {
    const start = game(['k#..', '##..', '....', '...K']);
    expect(play(start, [3, 3], [3, 2]).status).toBe('player-win');
  });

  it('isOver reflects the status', () => {
    const start = game(['..k.', '....', '....', 'K.Q.']);
    expect(isOver(start)).toBe(false);
    expect(isOver(play(start, [2, 3], [2, 0]))).toBe(true);
  });
});

describe('move limit', () => {
  it('reports the moves remaining', () => {
    const start = game(['k...', '....', '....', '...K'], { moveLimit: 3 });
    expect(movesLeft(start)).toBe(3);
    expect(movesLeft(play(start, [3, 3], [3, 2]))).toBe(2);
    expect(movesLeft(game(['k...', '....', '....', '...K']))).toBeNull();
  });

  it('draws once the player has used every move', () => {
    let s = game(['k...', '....', '....', '...K'], { moveLimit: 2 });
    s = play(s, [3, 3], [3, 2]); // player 1
    s = play(s, [0, 0], [0, 1]); // enemy
    expect(s.status).toBe('playing');
    s = play(s, [3, 2], [3, 3]); // player 2
    expect(s.status).toBe('playing'); // the enemy still gets its reply
    s = play(s, [0, 1], [0, 0]); // enemy
    expect(s.status).toBe('draw');
  });

  it('a king capture still beats the move limit', () => {
    let s = game(['k...', '....', '....', 'R..K'], { moveLimit: 1 });
    s = play(s, [0, 3], [0, 0]);
    expect(s.status).toBe('player-win');
  });
});

describe('enemy double-move modifier', () => {
  it('gives the enemy a second move on every Nth enemy turn', () => {
    let s = game(['k...', '....', '....', '...K'], { enemyDoubleMoveEvery: 1 });
    s = play(s, [3, 3], [3, 2]);
    expect(s.turn).toBe('b');
    s = play(s, [0, 0], [0, 1]);
    expect(s.turn).toBe('b'); // bonus move
    expect(s.extraEnemyMove).toBe(true);
    s = play(s, [0, 1], [0, 2]);
    expect(s.turn).toBe('w');
    expect(s.extraEnemyMove).toBe(false);
  });

  it('counts enemy turns, not plies, when the period is 3', () => {
    let s = game(
      [
        'k.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......K',
      ],
      { enemyDoubleMoveEvery: 3 },
    );
    const enemySquares: [number, number][] = [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ];
    const playerSquares: [number, number][] = [
      [7, 7],
      [7, 6],
      [7, 5],
      [7, 4],
      [7, 3],
    ];
    // turns 1 and 2 are single moves, turn 3 is a double move
    s = play(s, playerSquares[0]!, playerSquares[1]!);
    s = play(s, enemySquares[0]!, enemySquares[1]!);
    expect(s.turn).toBe('w');
    s = play(s, playerSquares[1]!, playerSquares[2]!);
    s = play(s, enemySquares[1]!, enemySquares[2]!);
    expect(s.turn).toBe('w');
    s = play(s, playerSquares[2]!, playerSquares[3]!);
    s = play(s, enemySquares[2]!, enemySquares[3]!);
    expect(s.turn).toBe('b');
    s = play(s, enemySquares[3]!, enemySquares[4]!);
    expect(s.turn).toBe('w');
    expect(s.enemyTurns).toBe(3);
  });

  it('does not count the bonus move against the player move limit', () => {
    let s = game(['k...', '....', '....', '...K'], { enemyDoubleMoveEvery: 1, moveLimit: 5 });
    s = play(s, [3, 3], [3, 2]);
    s = play(s, [0, 0], [0, 1]);
    s = play(s, [0, 1], [0, 2]);
    expect(s.playerMoves).toBe(1);
    expect(movesLeft(s)).toBe(4);
  });
});

describe('immutability', () => {
  it('does not mutate the previous state', () => {
    const start = game(['.k..', '....', '....', 'K...']);
    const before = JSON.stringify(start);
    play(start, [0, 3], [0, 2]);
    expect(JSON.stringify(start)).toBe(before);
  });
});
