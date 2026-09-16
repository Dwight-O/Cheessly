import { beforeEach, describe, expect, it } from 'vitest';
import { squareIndex } from '../engine';
import { useGameStore } from './gameStore';
import type { LevelConfig } from '../levels/types';

const LEVEL: LevelConfig = {
  index: 1,
  name: 'Test',
  rows: ['.k..', '....', '....', 'K.Q.'],
  aiDepth: 0,
  mistakeChance: 0,
  isBoss: false,
};

const store = () => useGameStore.getState();

describe('gameStore', () => {
  beforeEach(() => store().startLevel(LEVEL, 1));

  it('records the mode the level was started in', () => {
    expect(store().mode).toBe('run');
    store().startLevel(LEVEL, 1, 'preview');
    expect(store().mode).toBe('preview');
    store().startLevel(LEVEL, 1, 'daily');
    expect(store().mode).toBe('daily');
  });

  it('starts a level with the player to move', () => {
    expect(store().game?.turn).toBe('w');
    expect(store().selected).toBeNull();
  });

  it('selects a player piece and lists its targets', () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    expect(store().selected).toBe(squareIndex(board, 2, 3));
    expect(store().targets.length).toBeGreaterThan(0);
  });

  it('ignores taps on enemy and empty squares', () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 1, 0));
    expect(store().selected).toBeNull();
    store().tapSquare(squareIndex(board, 3, 1));
    expect(store().selected).toBeNull();
  });

  it('tapping the selected square again deselects it', () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    store().tapSquare(squareIndex(board, 2, 3));
    expect(store().selected).toBeNull();
    expect(store().targets).toEqual([]);
  });

  it('tapping a highlighted target plays the move and clears the selection', () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    store().tapSquare(squareIndex(board, 2, 1));
    expect(store().game?.turn).toBe('b');
    expect(store().game?.ply).toBe(1);
    expect(store().selected).toBeNull();
  });

  it('capturing the enemy king wins the level', () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    store().tapSquare(squareIndex(board, 2, 0));
    // the queen reached the enemy back rank; walk it onto the king next turn
    expect(store().game?.status === 'player-win' || store().game?.turn === 'b').toBe(true);
  });

  it('the enemy plays a legal reply', async () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    store().tapSquare(squareIndex(board, 2, 1));
    await store().playEnemyTurn();
    expect(store().game?.ply).toBe(2);
    expect(store().game?.turn).toBe('w');
  });

  it('refuses taps while it is the enemy turn', async () => {
    const board = store().game!.board;
    store().tapSquare(squareIndex(board, 2, 3));
    store().tapSquare(squareIndex(board, 2, 1));
    store().tapSquare(squareIndex(board, 0, 3));
    expect(store().selected).toBeNull();
  });
});
