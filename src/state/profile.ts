import { readJson, writeJson } from '../util/storage';

/** Bump when the shape changes incompatibly; unknown versions are discarded
 *  rather than migrated, which is the right trade for a casual game. */
export const PROFILE_VERSION = 1;

export interface Settings {
  sound: boolean;
  haptics: boolean;
}

export interface Profile {
  version: number;
  /** Highest level reached across all runs. */
  bestLevel: number;
  bestStreak: number;
  /** Meta-currency spent on upgrades between runs. */
  crowns: number;
  runs: number;
  /** Upgrade id -> levels purchased. Populated in phase 7. */
  upgrades: Record<string, number>;
  settings: Settings;
  tutorialSeen: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  version: PROFILE_VERSION,
  bestLevel: 0,
  bestStreak: 0,
  crowns: 0,
  runs: 0,
  upgrades: {},
  settings: { sound: true, haptics: true },
  tutorialSeen: false,
};

const KEY = 'profile';

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Profile>;
  return candidate.version === PROFILE_VERSION && typeof candidate.bestLevel === 'number';
}

export function loadProfile(): Profile {
  const stored = readJson<unknown>(KEY, null);
  if (!isProfile(stored)) return { ...DEFAULT_PROFILE };
  // Merge over the defaults so a field added later is never undefined.
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    settings: { ...DEFAULT_PROFILE.settings, ...stored.settings },
    upgrades: { ...stored.upgrades },
  };
}

export function saveProfile(profile: Profile): void {
  writeJson(KEY, profile);
}
