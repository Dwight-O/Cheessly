import { describe, expect, it } from 'vitest';
import { parseBoard } from '../engine';
import { evaluate, materialScore, mobilityScore } from './evaluate';

describe('evaluate', () => {
  it('counts material from the given side', () => {
    const board = parseBoard(['..k.', '....', '..r.', 'K.Q.']);
    // player: K 1000 + Q 9; enemy: K 1000 + R 5
    expect(materialScore(board, 'w')).toBe(4);
    expect(materialScore(board, 'b')).toBe(-4);
  });

  it('is symmetric for a mirrored position', () => {
    const board = parseBoard(['..k.', '....', '....', '..K.']);
    expect(materialScore(board, 'w')).toBe(0);
    expect(evaluate(board, 'w')).toBeCloseTo(-evaluate(board, 'b'), 10);
  });

  it('rewards having more moves available', () => {
    const board = parseBoard(['k#..', '##..', '....', '...K']);
    expect(mobilityScore(board, 'w')).toBeGreaterThan(0);
  });

  it('keeps mobility small enough not to outweigh a pawn', () => {
    const rich = parseBoard(['..k.', '....', '....', 'K..Q']);
    const poor = parseBoard(['..k.', '....', '....', 'K..P']);
    expect(evaluate(rich, 'w') - evaluate(poor, 'w')).toBeGreaterThan(7);
  });
});
