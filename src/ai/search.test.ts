import { describe, expect, it } from 'vitest';
import { createGame, parseBoard, squareIndex } from '../engine';
import type { Board, GameRules, GameState } from '../engine';
import { chooseMove } from './search';

const at = (board: Board, x: number, y: number) => squareIndex(board, x, y);
const game = (rows: string[], rules: GameRules = {}): GameState =>
  createGame(parseBoard(rows), rules);

describe('chooseMove', () => {
  it('captures the enemy king when it can', () => {
    const state = game(['..k.', '....', '....', 'K.Q.']);
    const result = chooseMove(state, { depth: 2, timeBudgetMs: 500, seed: 1 });
    expect(result.move?.to).toBe(at(state.board, 2, 0));
    expect(result.move?.captured).toBe('K');
  });

  it('takes a free queen', () => {
    const state = game(['k.q.', '....', '....', 'K.R.']);
    const result = chooseMove(state, { depth: 2, timeBudgetMs: 500, seed: 1 });
    expect(result.move?.captured).toBe('Q');
  });

  it('declines a capture that loses material on the reply', () => {
    const state = game(['..kr', '...p', '....', 'K..Q']);
    const shallow = chooseMove(state, { depth: 1, timeBudgetMs: 500, seed: 1 });
    const deep = chooseMove(state, { depth: 2, timeBudgetMs: 500, seed: 1 });
    const poisoned = at(state.board, 3, 1);
    expect(shallow.move?.to).toBe(poisoned); // depth 1 grabs the pawn
    expect(deep.move?.to).not.toBe(poisoned); // depth 2 sees the recapture
  });

  it('prefers the faster of two wins', () => {
    // The queen can take the king now, or shuffle and take it later.
    const state = game(['..k.', '....', '..Q.', 'K...']);
    const result = chooseMove(state, { depth: 4, timeBudgetMs: 500, seed: 1 });
    expect(result.move?.captured).toBe('K');
    expect(result.score).toBeGreaterThan(90_000);
  });

  it('returns null when the side to move has no move', () => {
    const state = game(['...k', '....', '##..', 'K#..']);
    expect(chooseMove(state, { depth: 2, seed: 1 }).move).toBeNull();
  });

  it('depth 0 plays a legal capture-preferring random move', () => {
    const state = game(['k.q.', '....', '....', 'K.R.']);
    const result = chooseMove(state, { depth: 0, seed: 7 });
    expect(result.move?.captured).toBe('Q');
    expect(result.depthReached).toBe(0);
  });

  it('is deterministic for a given seed and non-deterministic across seeds', () => {
    const state = game(['k...', '....', '....', 'K..R'], {});
    const a = chooseMove(state, { depth: 0, seed: 11 });
    const b = chooseMove(state, { depth: 0, seed: 11 });
    expect(a.move).toEqual(b.move);
    const seeds = new Set(
      Array.from({ length: 12 }, (_, i) =>
        JSON.stringify(chooseMove(state, { depth: 0, seed: i }).move),
      ),
    );
    expect(seeds.size).toBeGreaterThan(1);
  });

  it('plays a random move when the mistake roll fires', () => {
    const state = game(['..k.', '....', '....', 'K.Q.']);
    const always = chooseMove(state, { depth: 3, mistakeChance: 1, seed: 3 });
    expect(always.mistake).toBe(true);
    const never = chooseMove(state, { depth: 3, mistakeChance: 0, seed: 3 });
    expect(never.mistake).toBe(false);
    expect(never.move?.captured).toBe('K');
  });

  it('mistake chance is roughly honoured over many rolls', () => {
    const state = game(['..k.', '....', '....', 'K.Q.']);
    let mistakes = 0;
    for (let i = 0; i < 400; i++) {
      if (chooseMove(state, { depth: 1, mistakeChance: 0.3, seed: i }).mistake) mistakes++;
    }
    expect(mistakes / 400).toBeGreaterThan(0.2);
    expect(mistakes / 400).toBeLessThan(0.4);
  });

  it('handles the enemy double-move modifier without mis-attributing turns', () => {
    const state = game(['k..q', '....', '....', 'K...'], { enemyDoubleMoveEvery: 1 });
    const result = chooseMove(state, { depth: 3, timeBudgetMs: 500, seed: 2 });
    expect(result.move).not.toBeNull();
  });

  it('stays inside its time budget on a busy 8x8 board', () => {
    const state = game([
      'rnbqkbnr',
      'pppppppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'RNBQKBNR',
    ]);
    const result = chooseMove(state, { depth: 4, timeBudgetMs: 500, seed: 5 });
    expect(result.move).not.toBeNull();
    expect(result.elapsedMs).toBeLessThan(1200);
    expect(result.depthReached).toBeGreaterThanOrEqual(1);
  });
});
