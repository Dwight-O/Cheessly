import { chooseMove } from './search';
import type { SearchOptions, SearchResult } from './search';
import type { AiRequest, AiResponse } from './protocol';
import type { GameState, Move } from '../engine';
import type { LevelConfig } from '../levels/types';

/** Hard cap on thinking time, per the design target for a mid-range phone. */
export const TIME_BUDGET_MS = 500;
/** Moves that land instantly feel like a glitch, so never answer faster. */
export const MIN_THINK_MS = 260;
/** If the worker has not answered by now, something is wrong: fall back. */
const WORKER_TIMEOUT_MS = 3000;

type Pending = {
  resolve: (result: SearchResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

let worker: Worker | null = null;
let workerUnavailable = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerUnavailable) return null;
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    workerUnavailable = true;
    return null;
  }
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<AiResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      clearTimeout(entry.timer);
      entry.resolve(event.data.result);
    };
    worker.onerror = () => {
      // Give up on the worker for the rest of the session and run on the main
      // thread instead; a weaker experience beats a stuck game.
      workerUnavailable = true;
      worker?.terminate();
      worker = null;
      for (const [id, entry] of pending) {
        pending.delete(id);
        clearTimeout(entry.timer);
        entry.resolve({
          move: null,
          score: 0,
          depthReached: 0,
          nodes: 0,
          elapsedMs: 0,
          mistake: false,
        });
      }
    };
    return worker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

function searchInWorker(state: GameState, options: SearchOptions): Promise<SearchResult> {
  const instance = getWorker();
  if (!instance) return Promise.resolve(chooseMove(state, options));

  const id = nextId++;
  const request: AiRequest = { id, state, options };
  return new Promise<SearchResult>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(chooseMove(state, options));
    }, WORKER_TIMEOUT_MS);
    pending.set(id, { resolve, timer });
    instance.postMessage(request);
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function searchOptionsFor(level: LevelConfig, game: GameState, seed: number): SearchOptions {
  return {
    depth: level.aiDepth,
    mistakeChance: level.mistakeChance,
    timeBudgetMs: TIME_BUDGET_MS,
    seed: `${seed}:${level.index}:${game.ply}`,
  };
}

/**
 * Asks the AI for the enemy's move. Search runs in a Web Worker so the board
 * stays responsive; if a worker cannot be created the same code runs inline.
 */
export async function requestEnemyMove(
  game: GameState,
  level: LevelConfig,
  seed: number,
): Promise<Move | null> {
  const startedAt = Date.now();
  const result = await searchInWorker(game, searchOptionsFor(level, game, seed));
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_THINK_MS) await delay(MIN_THINK_MS - elapsed);
  if (result.move) return result.move;
  // The worker failed; fall back to a legal move rather than stalling.
  return chooseMove(game, searchOptionsFor(level, game, seed)).move;
}
