import { describe, expect, it } from 'vitest';
import { HAND_TUNED_COUNT, HAND_TUNED_LEVELS } from './handTuned';
import { validateLevel } from './validate';
import { boardSizeFor } from './difficulty';
import { parseBoard } from '../engine';

describe('hand-tuned levels', () => {
  it('there are 30 of them, numbered 1..30', () => {
    expect(HAND_TUNED_COUNT).toBe(30);
    expect(HAND_TUNED_LEVELS.map((l) => l.index)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
  });

  it.each(HAND_TUNED_LEVELS.map((level) => [level.index, level.name, level] as const))(
    'level %i (%s) is playable',
    (_index, _name, level) => {
      const result = validateLevel(level);
      expect(result.problems).toEqual([]);
      expect(result.ok).toBe(true);
    },
  );

  it.each(HAND_TUNED_LEVELS.map((level) => [level.index, level] as const))(
    'level %i cannot be won on move 1',
    (_index, level) => {
      expect(validateLevel(level).warnings).not.toContain('the player can win on move 1');
    },
  );

  it('board sizes follow the curve', () => {
    for (const level of HAND_TUNED_LEVELS) {
      const board = parseBoard(level.rows);
      expect(board.width).toBe(board.height);
      expect(board.width).toBe(boardSizeFor(level.index));
    }
  });

  it('difficulty never goes backwards on the AI levers', () => {
    for (let i = 1; i < HAND_TUNED_LEVELS.length; i++) {
      const previous = HAND_TUNED_LEVELS[i - 1]!;
      const current = HAND_TUNED_LEVELS[i]!;
      expect(current.aiDepth).toBeGreaterThanOrEqual(previous.aiDepth);
      expect(current.mistakeChance).toBeLessThanOrEqual(previous.mistakeChance);
    }
  });

  it('marks levels 10, 20 and 30 as bosses', () => {
    expect(HAND_TUNED_LEVELS.filter((l) => l.isBoss).map((l) => l.index)).toEqual([10, 20, 30]);
  });
});
