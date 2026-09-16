import { describe, expect, it } from 'vitest';
import {
  DAILY_LEVEL_COUNT,
  dailyLevels,
  dailyScore,
  EMPTY_DAILY,
  formatCountdown,
  isDailyComplete,
  msUntilNextDaily,
  openDaily,
  previousDate,
  recordDailyResult,
  todayUtc,
} from './daily';
import { validateLevel } from '../levels';
import type { DailyState } from './daily';

const base: DailyState = { ...EMPTY_DAILY, date: '2026-09-16' };

describe('daily dates', () => {
  it('uses the UTC calendar date as the seed', () => {
    expect(todayUtc(new Date('2026-09-16T23:59:00Z'))).toBe('2026-09-16');
    expect(todayUtc(new Date('2026-09-17T00:00:01Z'))).toBe('2026-09-17');
  });

  it('steps back a day across a month boundary', () => {
    expect(previousDate('2026-09-01')).toBe('2026-08-31');
    expect(previousDate('2026-01-01')).toBe('2025-12-31');
  });

  it('counts down to the next UTC midnight', () => {
    const noon = Date.parse('2026-09-16T12:00:00Z');
    expect(msUntilNextDaily(noon)).toBe(12 * 60 * 60 * 1000);
    expect(formatCountdown(msUntilNextDaily(noon))).toBe('12:00:00');
    expect(formatCountdown(0)).toBe('00:00:00');
  });
});

describe('daily levels', () => {
  it('are the same for a date and different between dates', () => {
    expect(dailyLevels('2026-09-16').map((l) => l.rows)).toEqual(
      dailyLevels('2026-09-16').map((l) => l.rows),
    );
    expect(dailyLevels('2026-09-16')[0]?.rows).not.toEqual(dailyLevels('2026-09-17')[0]?.rows);
  });

  it('are five valid levels of increasing difficulty', () => {
    const levels = dailyLevels('2026-09-16');
    expect(levels).toHaveLength(DAILY_LEVEL_COUNT);
    for (const level of levels) expect(validateLevel(level).ok).toBe(true);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]!.index).toBeGreaterThan(levels[i - 1]!.index);
    }
  });

  it('ignores meta upgrades, so every player faces the same board', () => {
    expect(dailyLevels('2026-09-16')[0]?.rows.join('')).not.toContain('NN');
  });
});

describe('daily attempts', () => {
  it('keeps results for the same date and clears them on a new date', () => {
    const played = recordDailyResult(base, 'win');
    expect(openDaily(played, '2026-09-16').results).toEqual(['win']);
    expect(openDaily(played, '2026-09-17').results).toEqual([]);
  });

  it('records at most five results', () => {
    let state = base;
    for (let i = 0; i < 8; i++) state = recordDailyResult(state, 'win');
    expect(state.results).toHaveLength(DAILY_LEVEL_COUNT);
  });

  it('scores the wins', () => {
    let state = base;
    for (const result of ['win', 'win', 'loss', 'win', 'loss'] as const) {
      state = recordDailyResult(state, result);
    }
    expect(dailyScore(state)).toBe(3);
    expect(isDailyComplete(state, '2026-09-16')).toBe(true);
    expect(isDailyComplete(state, '2026-09-17')).toBe(false);
  });
});

describe('daily streak', () => {
  function complete(state: DailyState): DailyState {
    let next = state;
    for (let i = 0; i < DAILY_LEVEL_COUNT; i++) next = recordDailyResult(next, 'win');
    return next;
  }

  it('starts at one', () => {
    expect(complete(base).streak).toBe(1);
  });

  it('extends on consecutive days', () => {
    const day1 = complete(base);
    const day2 = complete(openDaily(day1, '2026-09-17'));
    const day3 = complete(openDaily(day2, '2026-09-18'));
    expect(day3.streak).toBe(3);
    expect(day3.bestStreak).toBe(3);
  });

  it('resets after a missed day but keeps the best', () => {
    const day1 = complete(complete(base));
    const day2 = complete(openDaily(day1, '2026-09-17'));
    const later = complete(openDaily(day2, '2026-09-20'));
    expect(later.streak).toBe(1);
    expect(later.bestStreak).toBe(2);
  });

  it('does not double-count the same day', () => {
    const done = complete(base);
    expect(recordDailyResult(done, 'win')).toEqual(done);
  });
});
