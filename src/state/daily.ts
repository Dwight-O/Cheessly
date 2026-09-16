import { generateLevel } from '../levels';
import type { LevelConfig } from '../levels';
import { hashString } from '../util/prng';
import { readJson, writeJson } from '../util/storage';

export const DAILY_VERSION = 1;
export const DAILY_LEVEL_COUNT = 5;
/** A fixed difficulty ramp, so every player faces the same five shapes. */
export const DAILY_LEVEL_INDICES: readonly number[] = [8, 14, 20, 26, 32];

export type DailyResult = 'win' | 'loss';

export interface DailyState {
  version: number;
  /** The UTC date the current attempt belongs to, `YYYY-MM-DD`. */
  date: string;
  results: DailyResult[];
  streak: number;
  bestStreak: number;
  /** The last date the player finished all five levels. */
  lastCompletedDate: string;
}

export const EMPTY_DAILY: DailyState = {
  version: DAILY_VERSION,
  date: '',
  results: [],
  streak: 0,
  bestStreak: 0,
  lastCompletedDate: '',
};

/** Today's UTC date as `YYYY-MM-DD`; this is the daily seed. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function previousDate(date: string): string {
  const time = Date.parse(`${date}T00:00:00Z`);
  return new Date(time - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Milliseconds until the next UTC midnight, for the countdown. */
export function msUntilNextDaily(now: number = Date.now()): number {
  const day = 24 * 60 * 60 * 1000;
  return day - (now % day);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** The five levels for a date. Generated, never hand-tuned, so the daily is
 *  the same for everyone and is not affected by meta upgrades. */
export function dailyLevels(date: string): LevelConfig[] {
  const seed = hashString(`daily:${date}`);
  return DAILY_LEVEL_INDICES.map((index, position) => ({
    ...generateLevel(index, seed),
    name: `Daily ${position + 1}`,
  }));
}

/** Starts (or resumes) the attempt for `date`. A new date clears the results;
 *  the same date keeps them, so one attempt per day cannot be retried. */
export function openDaily(state: DailyState, date: string): DailyState {
  if (state.date === date) return state;
  return { ...state, date, results: [] };
}

export function isDailyComplete(state: DailyState, date: string): boolean {
  return state.date === date && state.results.length >= DAILY_LEVEL_COUNT;
}

export function dailyScore(state: DailyState): number {
  return state.results.filter((result) => result === 'win').length;
}

/** Records one level's outcome, and updates the streak when the fifth lands. */
export function recordDailyResult(state: DailyState, result: DailyResult): DailyState {
  if (state.results.length >= DAILY_LEVEL_COUNT) return state;
  const results = [...state.results, result];
  if (results.length < DAILY_LEVEL_COUNT) return { ...state, results };

  const alreadyCounted = state.lastCompletedDate === state.date;
  const continuing = state.lastCompletedDate === previousDate(state.date);
  const streak = alreadyCounted ? state.streak : continuing ? state.streak + 1 : 1;
  return {
    ...state,
    results,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastCompletedDate: state.date,
  };
}

const KEY = 'daily';

function isDailyState(value: unknown): value is DailyState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<DailyState>;
  return candidate.version === DAILY_VERSION && Array.isArray(candidate.results);
}

export function loadDaily(): DailyState {
  const stored = readJson<unknown>(KEY, null);
  return isDailyState(stored) ? { ...EMPTY_DAILY, ...stored } : { ...EMPTY_DAILY };
}

export function saveDaily(state: DailyState): void {
  writeJson(KEY, state);
}
