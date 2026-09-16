import type { GameStatus } from '../engine';
import { getLevel } from '../levels';
import { useAppStore } from './appStore';
import { dailyLevels, DAILY_LEVEL_COUNT, todayUtc } from './daily';
import { useDailyStore } from './dailyStore';
import { useGameStore } from './gameStore';
import { useRunStore } from './runStore';

/** Loads the level the run is currently on and shows the board. */
export function openCurrentLevel(): void {
  const { run } = useRunStore.getState();
  if (!run) return;
  useGameStore.getState().startLevel(getLevel(run.level, run.seed), run.seed);
  useAppStore.getState().go('game');
}

export function startNewRun(seed?: number): void {
  useRunStore.getState().startRun(seed);
  openCurrentLevel();
}

/**
 * Applies a finished level to the run and moves on: the next level, or the
 * run-end screen when the last heart is gone.
 */
export function advanceAfterLevel(status: GameStatus): void {
  const { recordResult } = useRunStore.getState();
  const result = recordResult(status);
  if (result.runOver) {
    useAppStore.getState().go('runEnd');
    return;
  }
  openCurrentLevel();
}

export function quitToHome(): void {
  useAppStore.getState().go('home');
}

/** Opens today's daily challenge at the first level not yet played. */
export function startDaily(): void {
  const daily = useDailyStore.getState();
  daily.open();
  const state = useDailyStore.getState().state;
  if (state.results.length >= DAILY_LEVEL_COUNT) {
    useAppStore.getState().go('daily');
    return;
  }
  openDailyLevel();
}

function openDailyLevel(): void {
  const state = useDailyStore.getState().state;
  const date = state.date || todayUtc();
  const level = dailyLevels(date)[state.results.length];
  if (!level) {
    useAppStore.getState().go('daily');
    return;
  }
  useGameStore.getState().startLevel(level, 0, 'daily');
  useAppStore.getState().go('game');
}

/** Records a finished daily level and moves to the next one, or to the
 *  results screen once all five are done. A draw is replayed, unrecorded. */
export function advanceDaily(status: GameStatus): void {
  if (status === 'draw' || status === 'playing') {
    openDailyLevel();
    return;
  }
  useDailyStore.getState().record(status === 'player-win' ? 'win' : 'loss');
  const state = useDailyStore.getState().state;
  if (state.results.length >= DAILY_LEVEL_COUNT) {
    useAppStore.getState().go('daily');
    return;
  }
  openDailyLevel();
}
