import type { GameStatus } from '../engine';
import { getLevel } from '../levels';
import { useAppStore } from './appStore';
import { dailyLevels, DAILY_LEVEL_COUNT, todayUtc } from './daily';
import { useDailyStore } from './dailyStore';
import { useGameStore } from './gameStore';
import { useRunStore } from './runStore';
import { levelOptionsFor } from './upgrades';

/** Loads the level the run is currently on and shows the board. */
export function openCurrentLevel(): void {
  const { run, profile } = useRunStore.getState();
  if (!run) return;
  const level = getLevel(run.level, run.seed, levelOptionsFor(profile));
  useGameStore.getState().startLevel(level, run.seed);
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

/**
 * Spends one of the run's undos to take back the player's last move (and the
 * enemy's reply). Only available while the level is still in play: an undo is
 * a fix for a mis-tap, not a revive after the king has fallen.
 */
export function undoMove(): boolean {
  const game = useGameStore.getState();
  if (!game.canUndo()) return false;
  if (!useRunStore.getState().consumeUndo()) return false;
  game.undo();
  return true;
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
