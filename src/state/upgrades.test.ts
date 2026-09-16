import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from './profile';
import type { Profile } from './profile';
import {
  canAfford,
  levelOptionsFor,
  nextCost,
  ownedLevel,
  purchase,
  runOptionsFor,
  UPGRADES,
  upgradeAllowance,
} from './upgrades';
import { enemyBudgetFor } from '../levels';

const profileWith = (crowns: number, upgrades: Record<string, number> = {}): Profile => ({
  ...DEFAULT_PROFILE,
  crowns,
  upgrades,
});

describe('upgrade catalogue', () => {
  it('lists the four MVP upgrades with escalating costs', () => {
    expect(UPGRADES.map((u) => u.id)).toEqual(['heart', 'knight', 'undo', 'checkpoint']);
    for (const upgrade of UPGRADES) {
      expect(upgrade.costs).toHaveLength(upgrade.maxLevel);
      for (let i = 1; i < upgrade.costs.length; i++) {
        expect(upgrade.costs[i]!).toBeGreaterThan(upgrade.costs[i - 1]!);
      }
    }
  });

  it('caps hearts at five', () => {
    const maxed = profileWith(0, { heart: 99 });
    expect(ownedLevel(maxed, 'heart')).toBe(2);
    expect(runOptionsFor(maxed).maxHearts).toBe(5);
    expect(nextCost(maxed, 'heart')).toBeNull();
  });
});

describe('buying', () => {
  it('deducts the cost and records the level', () => {
    const result = purchase(profileWith(100), 'knight');
    expect(result.ok).toBe(true);
    expect(result.profile.crowns).toBe(10);
    expect(ownedLevel(result.profile, 'knight')).toBe(1);
  });

  it('refuses when the player cannot afford it', () => {
    const result = purchase(profileWith(10), 'knight');
    expect(result.ok).toBe(false);
    expect(result.profile.crowns).toBe(10);
    expect(canAfford(profileWith(10), 'knight')).toBe(false);
  });

  it('refuses beyond the maximum level', () => {
    const result = purchase(profileWith(999, { knight: 1 }), 'knight');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/maximum/);
  });

  it('charges the escalating price for the second heart', () => {
    const first = purchase(profileWith(300), 'heart');
    expect(first.profile.crowns).toBe(240);
    const second = purchase(first.profile, 'heart');
    expect(second.profile.crowns).toBe(90);
  });
});

describe('run and level options', () => {
  it('a fresh profile gives the base run', () => {
    const options = runOptionsFor(DEFAULT_PROFILE);
    expect(options).toMatchObject({ maxHearts: 3, checkpointEvery: 5, undosLeft: 0 });
  });

  it('applies every upgrade to the run', () => {
    const profile = profileWith(0, { heart: 2, undo: 1, checkpoint: 1 });
    expect(runOptionsFor(profile)).toMatchObject({
      maxHearts: 5,
      hearts: 5,
      checkpointEvery: 4,
      undosLeft: 1,
    });
  });

  it('passes the extra knight through to level generation', () => {
    expect(levelOptionsFor(profileWith(0, { knight: 1 })).extraKnight).toBe(true);
    expect(levelOptionsFor(DEFAULT_PROFILE).extraKnight).toBe(false);
  });
});

describe('difficulty budget accounts for upgrades', () => {
  it('an unupgraded profile adds nothing', () => {
    expect(upgradeAllowance(DEFAULT_PROFILE)).toBe(0);
  });

  it('every upgrade raises the enemy budget', () => {
    const fully = profileWith(0, { heart: 2, knight: 1, undo: 1, checkpoint: 1 });
    const allowance = upgradeAllowance(fully);
    expect(allowance).toBe(1 + 3 + 1 + 1);
    expect(enemyBudgetFor(50, allowance)).toBeGreaterThan(enemyBudgetFor(50, 0));
  });

  it('the knight upgrade is worth at least the knight it grants', () => {
    const knightOnly = profileWith(0, { knight: 1 });
    expect(upgradeAllowance(knightOnly)).toBeGreaterThanOrEqual(3);
  });
});
