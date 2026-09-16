import { randomMove } from './random';
import type { GameState, Move } from '../engine';
import type { LevelConfig } from '../levels/types';
import { createRng } from '../util/prng';

/**
 * Asks the AI for the enemy's move.
 *
 * Phase 2 answers with the random/capture-preferring AI on the main thread.
 * Phase 3 replaces the body with a Web Worker running minimax; the signature
 * stays the same so the store never changes.
 */
export async function requestEnemyMove(
  game: GameState,
  level: LevelConfig,
  seed: number,
): Promise<Move | null> {
  const rng = createRng(`${seed}:${level.index}:${game.ply}`);
  return randomMove(game.board, game.turn, rng);
}
