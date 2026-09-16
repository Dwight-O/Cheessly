import { readJson, removeKey, writeJson } from '../util/storage';

export const RUN_VERSION = 1;
export const BASE_HEARTS = 3;
export const MAX_HEARTS = 5;
export const DEFAULT_CHECKPOINT_EVERY = 5;
export const BOSS_EVERY = 10;

export interface RunState {
  version: number;
  seed: number;
  /** The level currently being played. */
  level: number;
  hearts: number;
  maxHearts: number;
  /** The player never drops below this level on a loss. */
  checkpoint: number;
  checkpointEvery: number;
  /** Consecutive level wins in this run. */
  streak: number;
  /** Highest level reached in this run; the Crowns payout is based on it. */
  highest: number;
  /** Undos remaining, granted by a meta upgrade. */
  undosLeft: number;
}

export function isBossLevel(level: number): boolean {
  return level % BOSS_EVERY === 0;
}

/** The checkpoint that applies at `level`: 1, then every `every` levels after
 *  it (1, 6, 11, ... for the default of 5). */
export function checkpointFor(level: number, every: number): number {
  return Math.max(1, Math.floor((level - 1) / every) * every + 1);
}

export function isCheckpointLevel(level: number, every: number): boolean {
  return level > 1 && checkpointFor(level, every) === level;
}

/**
 * Crowns awarded when a run ends. Linear in the level reached with a bonus per
 * boss cleared, so deep runs pay noticeably better without exploding.
 */
export function crownsForRun(highestLevel: number): number {
  if (highestLevel <= 0) return 0;
  return highestLevel * 2 + 10 * Math.floor(highestLevel / BOSS_EVERY);
}

export function createRun(seed: number, options: Partial<RunState> = {}): RunState {
  const maxHearts = options.maxHearts ?? BASE_HEARTS;
  const checkpointEvery = options.checkpointEvery ?? DEFAULT_CHECKPOINT_EVERY;
  return {
    version: RUN_VERSION,
    seed,
    level: 1,
    hearts: maxHearts,
    maxHearts,
    checkpoint: 1,
    checkpointEvery,
    streak: 0,
    highest: 1,
    undosLeft: options.undosLeft ?? 0,
    ...options,
  };
}

/** Win: climb one level, extend the streak, and bank a checkpoint if the new
 *  level is one. */
export function applyWin(run: RunState): RunState {
  const level = run.level + 1;
  return {
    ...run,
    level,
    streak: run.streak + 1,
    highest: Math.max(run.highest, level),
    checkpoint: Math.max(run.checkpoint, checkpointFor(level, run.checkpointEvery)),
  };
}

/** Loss: one heart, one level down, never below the checkpoint. */
export function applyLoss(run: RunState): RunState {
  return {
    ...run,
    hearts: Math.max(0, run.hearts - 1),
    level: Math.max(run.checkpoint, run.level - 1),
    streak: 0,
  };
}

/** Draw: the level is replayed with no penalty at all. */
export function applyDraw(run: RunState): RunState {
  return run;
}

export function isRunOver(run: RunState): boolean {
  return run.hearts <= 0;
}

const KEY = 'run';

function isRunState(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RunState>;
  return candidate.version === RUN_VERSION && typeof candidate.level === 'number';
}

export function loadRun(): RunState | null {
  const stored = readJson<unknown>(KEY, null);
  return isRunState(stored) ? stored : null;
}

export function saveRun(run: RunState | null): void {
  if (run) writeJson(KEY, run);
  else removeKey(KEY);
}
