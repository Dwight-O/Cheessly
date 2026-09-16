import { beforeEach, describe, expect, it, vi } from 'vitest';
import { squareIndex } from '../engine';
import { useGameStore } from './gameStore';
import { useRunStore } from './runStore';
import { undoMove } from './flow';
import { DEFAULT_PROFILE } from './profile';
import { createRun } from './run';
import type { LevelConfig } from '../levels';

const LEVEL: LevelConfig = {
  index: 1,
  name: 'Undo test',
  rows: ['.k..', '....', '....', 'K.Q.'],
  aiDepth: 0,
  mistakeChance: 0,
  isBoss: false,
};

const game = () => useGameStore.getState();
const run = () => useRunStore.getState();

describe('undo', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', undefined);
    useRunStore.setState({
      run: { ...createRun(1), undosLeft: 1 },
      profile: { ...DEFAULT_PROFILE },
      summary: null,
    });
    game().startLevel(LEVEL, 1);
  });

  it('is unavailable before the player has moved', () => {
    expect(game().canUndo()).toBe(false);
    expect(undoMove()).toBe(false);
  });

  it('restores the position before the last player move', () => {
    const board = game().game!.board;
    const before = game().game!;
    game().tapSquare(squareIndex(board, 2, 3));
    game().tapSquare(squareIndex(board, 2, 1));
    expect(game().game?.ply).toBe(1);
    expect(game().canUndo()).toBe(true);
    expect(undoMove()).toBe(true);
    expect(game().game).toEqual(before);
    expect(game().game?.turn).toBe('w');
  });

  it('spends one undo per run', () => {
    const board = game().game!.board;
    game().tapSquare(squareIndex(board, 2, 3));
    game().tapSquare(squareIndex(board, 2, 1));
    expect(undoMove()).toBe(true);
    expect(run().run?.undosLeft).toBe(0);
    game().tapSquare(squareIndex(board, 2, 3));
    game().tapSquare(squareIndex(board, 2, 1));
    expect(undoMove()).toBe(false);
  });

  it('starting a level clears the history', () => {
    const board = game().game!.board;
    game().tapSquare(squareIndex(board, 2, 3));
    game().tapSquare(squareIndex(board, 2, 1));
    game().startLevel(LEVEL, 1);
    expect(game().history).toEqual([]);
    expect(game().canUndo()).toBe(false);
  });
});
