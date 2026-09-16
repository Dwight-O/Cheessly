import type { Profile } from './profile';
import { BASE_HEARTS, DEFAULT_CHECKPOINT_EVERY, MAX_HEARTS } from './run';
import type { RunState } from './run';

export type UpgradeId = 'heart' | 'knight' | 'undo' | 'checkpoint';

export interface Upgrade {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  /** How many times it can be bought. */
  readonly maxLevel: number;
  /** Crown cost of each successive purchase. */
  readonly costs: readonly number[];
  /**
   * Extra enemy material the level generator is given per purchased level, so
   * an upgrade buys comfort rather than a trivial late ladder.
   */
  readonly allowancePerLevel: number;
}

/** Upgrade definitions are data, like levels. */
export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'heart',
    name: 'Extra heart',
    description: 'Start each run with one more heart, up to five.',
    maxLevel: MAX_HEARTS - BASE_HEARTS,
    costs: [60, 150],
    allowancePerLevel: 0.5,
  },
  {
    id: 'knight',
    name: 'Extra knight',
    description: 'Begin every level with one more knight.',
    maxLevel: 1,
    costs: [90],
    allowancePerLevel: 3,
  },
  {
    id: 'undo',
    name: 'Undo',
    description: 'Take back one move per run.',
    maxLevel: 1,
    costs: [70],
    allowancePerLevel: 1,
  },
  {
    id: 'checkpoint',
    name: 'Closer checkpoints',
    description: 'Checkpoints every four levels instead of five.',
    maxLevel: 1,
    costs: [120],
    allowancePerLevel: 1,
  },
];

export function upgradeById(id: UpgradeId): Upgrade {
  const upgrade = UPGRADES.find((candidate) => candidate.id === id);
  if (!upgrade) throw new Error(`unknown upgrade: ${id}`);
  return upgrade;
}

export function ownedLevel(profile: Profile, id: UpgradeId): number {
  return Math.max(0, Math.min(upgradeById(id).maxLevel, profile.upgrades[id] ?? 0));
}

/** Cost of the next purchase, or `null` when it is maxed out. */
export function nextCost(profile: Profile, id: UpgradeId): number | null {
  const upgrade = upgradeById(id);
  const owned = ownedLevel(profile, id);
  if (owned >= upgrade.maxLevel) return null;
  return upgrade.costs[owned] ?? null;
}

export function canAfford(profile: Profile, id: UpgradeId): boolean {
  const cost = nextCost(profile, id);
  return cost !== null && profile.crowns >= cost;
}

/** Total extra enemy material the generator gets, given what the player owns. */
export function upgradeAllowance(profile: Profile): number {
  return UPGRADES.reduce(
    (total, upgrade) => total + ownedLevel(profile, upgrade.id) * upgrade.allowancePerLevel,
    0,
  );
}

/** How a new run starts, given the upgrades owned. */
export function runOptionsFor(profile: Profile): Partial<RunState> {
  const hearts = BASE_HEARTS + ownedLevel(profile, 'heart');
  return {
    maxHearts: Math.min(MAX_HEARTS, hearts),
    hearts: Math.min(MAX_HEARTS, hearts),
    checkpointEvery: ownedLevel(profile, 'checkpoint') > 0 ? 4 : DEFAULT_CHECKPOINT_EVERY,
    undosLeft: ownedLevel(profile, 'undo'),
  };
}

/** Options passed to `getLevel`, so boards reflect the player's upgrades. */
export function levelOptionsFor(profile: Profile): {
  extraKnight: boolean;
  budgetAllowance: number;
} {
  return {
    extraKnight: ownedLevel(profile, 'knight') > 0,
    budgetAllowance: upgradeAllowance(profile),
  };
}

export interface PurchaseResult {
  ok: boolean;
  profile: Profile;
  reason?: string;
}

export function purchase(profile: Profile, id: UpgradeId): PurchaseResult {
  const cost = nextCost(profile, id);
  if (cost === null) return { ok: false, profile, reason: 'already at the maximum' };
  if (profile.crowns < cost) return { ok: false, profile, reason: 'not enough Crowns' };
  return {
    ok: true,
    profile: {
      ...profile,
      crowns: profile.crowns - cost,
      upgrades: { ...profile.upgrades, [id]: ownedLevel(profile, id) + 1 },
    },
  };
}
