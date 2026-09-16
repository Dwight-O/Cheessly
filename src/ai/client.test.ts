import { describe, expect, it } from 'vitest';
import { createGame, parseBoard } from '../engine';
import { MIN_THINK_MS, requestEnemyMove, searchOptionsFor, TIME_BUDGET_MS } from './client';
import type { LevelConfig } from '../levels/types';

const LEVEL: LevelConfig = {
  index: 7,
  name: 'Client test',
  rows: ['..k.', '....', '....', 'K.Q.'],
  aiDepth: 2,
  mistakeChance: 0,
  isBoss: false,
};

describe('ai client', () => {
  it('derives search options from the level and the seed', () => {
    const game = createGame(parseBoard(LEVEL.rows as string[]));
    const options = searchOptionsFor(LEVEL, game, 42);
    expect(options.depth).toBe(2);
    expect(options.mistakeChance).toBe(0);
    expect(options.timeBudgetMs).toBe(TIME_BUDGET_MS);
    expect(options.seed).toBe('42:7:0');
  });

  it('falls back to the main thread when no Worker exists, and still answers', async () => {
    expect(typeof Worker).toBe('undefined'); // the Node test environment
    const game = createGame(parseBoard(['..k.', '....', 'K...', '....']));
    const move = await requestEnemyMove(game, LEVEL, 1);
    expect(move).not.toBeNull();
  });

  it('never answers faster than the artificial thinking delay', async () => {
    const game = createGame(parseBoard(['..k.', '....', 'K...', '....']));
    const startedAt = Date.now();
    await requestEnemyMove(game, LEVEL, 1);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(MIN_THINK_MS - 20);
  });
});
