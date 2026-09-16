import type { GameStatus } from '../engine';
import { getLevel } from '../levels';
import { useAppStore } from './appStore';
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
