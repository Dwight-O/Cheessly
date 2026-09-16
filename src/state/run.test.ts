import { describe, expect, it } from 'vitest';
import {
  applyDraw,
  applyLoss,
  applyWin,
  checkpointFor,
  createRun,
  crownsForRun,
  isBossLevel,
  isCheckpointLevel,
  isRunOver,
} from './run';

describe('checkpoints', () => {
  it('sits at level 1 and then every fifth level', () => {
    expect(checkpointFor(1, 5)).toBe(1);
    expect(checkpointFor(5, 5)).toBe(1);
    expect(checkpointFor(6, 5)).toBe(6);
    expect(checkpointFor(10, 5)).toBe(6);
    expect(checkpointFor(11, 5)).toBe(11);
  });

  it('moves every fourth level with the upgrade', () => {
    expect(checkpointFor(5, 4)).toBe(5);
    expect(checkpointFor(8, 4)).toBe(5);
    expect(checkpointFor(9, 4)).toBe(9);
  });

  it('identifies checkpoint levels', () => {
    expect(isCheckpointLevel(6, 5)).toBe(true);
    expect(isCheckpointLevel(7, 5)).toBe(false);
    expect(isCheckpointLevel(1, 5)).toBe(false);
  });
});

describe('boss levels', () => {
  it('lands on every tenth level', () => {
    expect(isBossLevel(10)).toBe(true);
    expect(isBossLevel(20)).toBe(true);
    expect(isBossLevel(11)).toBe(false);
  });
});

describe('run progression', () => {
  it('starts at level 1 with three hearts', () => {
    const run = createRun(1);
    expect(run.level).toBe(1);
    expect(run.hearts).toBe(3);
    expect(run.checkpoint).toBe(1);
  });

  it('climbs one level and extends the streak on a win', () => {
    const run = applyWin(applyWin(createRun(1)));
    expect(run.level).toBe(3);
    expect(run.streak).toBe(2);
    expect(run.highest).toBe(3);
  });

  it('banks a checkpoint when the new level is one', () => {
    let run = createRun(1);
    for (let i = 0; i < 5; i++) run = applyWin(run);
    expect(run.level).toBe(6);
    expect(run.checkpoint).toBe(6);
  });

  it('drops a level and a heart on a loss', () => {
    let run = applyWin(applyWin(createRun(1)));
    run = applyLoss(run);
    expect(run.level).toBe(2);
    expect(run.hearts).toBe(2);
    expect(run.streak).toBe(0);
  });

  it('never drops below the checkpoint', () => {
    let run = createRun(1);
    for (let i = 0; i < 5; i++) run = applyWin(run); // level 6, checkpoint 6
    run = applyLoss(run);
    expect(run.level).toBe(6);
    run = applyLoss(run);
    expect(run.level).toBe(6);
    expect(run.hearts).toBe(1);
  });

  it('keeps the highest level reached after dropping back', () => {
    let run = createRun(1);
    for (let i = 0; i < 3; i++) run = applyWin(run);
    run = applyLoss(run);
    expect(run.level).toBe(3);
    expect(run.highest).toBe(4);
  });

  it('a draw changes nothing at all', () => {
    const run = applyWin(createRun(1));
    expect(applyDraw(run)).toEqual(run);
  });

  it('ends the run at zero hearts', () => {
    let run = createRun(1);
    expect(isRunOver(run)).toBe(false);
    for (let i = 0; i < 3; i++) run = applyLoss(run);
    expect(run.hearts).toBe(0);
    expect(isRunOver(run)).toBe(true);
  });
});

describe('crowns', () => {
  it('scales with the level reached and pays a boss bonus', () => {
    expect(crownsForRun(0)).toBe(0);
    expect(crownsForRun(1)).toBe(2);
    expect(crownsForRun(9)).toBe(18);
    expect(crownsForRun(10)).toBe(30);
    expect(crownsForRun(22)).toBe(64);
  });

  it('never pays less for a deeper run', () => {
    for (let level = 1; level < 60; level++) {
      expect(crownsForRun(level + 1)).toBeGreaterThanOrEqual(crownsForRun(level));
    }
  });
});
