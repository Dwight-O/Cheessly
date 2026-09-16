import { create } from 'zustand';
import type { GameStatus } from '../engine';
import { DEFAULT_PROFILE, loadProfile, saveProfile } from './profile';
import type { Profile, Settings } from './profile';
import {
  applyDraw,
  applyLoss,
  applyWin,
  createRun,
  crownsForRun,
  isRunOver,
  loadRun,
  saveRun,
} from './run';
import type { RunState } from './run';

export interface RunSummary {
  highest: number;
  streak: number;
  crowns: number;
  newBest: boolean;
}

export interface LevelResult {
  runOver: boolean;
  nextLevel: number;
}

interface RunStore {
  run: RunState | null;
  profile: Profile;
  /** Set when a run ends, so the run-end screen has something to show. */
  summary: RunSummary | null;

  hydrate(): void;
  startRun(seed?: number): void;
  /** Applies a finished level's result to the run. */
  recordResult(status: GameStatus): LevelResult;
  abandonRun(): void;
  clearSummary(): void;
  updateSettings(patch: Partial<Settings>): void;
  markTutorialSeen(): void;
  addCrowns(amount: number): void;
}

function persist(run: RunState | null, profile: Profile) {
  saveRun(run);
  saveProfile(profile);
}

export const useRunStore = create<RunStore>((set, get) => ({
  run: null,
  profile: { ...DEFAULT_PROFILE },
  summary: null,

  hydrate() {
    set({ profile: loadProfile(), run: loadRun() });
  },

  startRun(seed = Date.now() >>> 0) {
    const { profile } = get();
    const run = createRun(seed, runOptionsFromProfile(profile));
    set({ run, summary: null });
    persist(run, profile);
  },

  recordResult(status) {
    const { run, profile } = get();
    if (!run) return { runOver: false, nextLevel: 1 };

    if (status === 'draw' || status === 'playing') {
      const next = applyDraw(run);
      set({ run: next });
      persist(next, profile);
      return { runOver: false, nextLevel: next.level };
    }

    if (status === 'player-win') {
      const next = applyWin(run);
      const updatedProfile: Profile = {
        ...profile,
        bestLevel: Math.max(profile.bestLevel, next.highest),
        bestStreak: Math.max(profile.bestStreak, next.streak),
      };
      set({ run: next, profile: updatedProfile });
      persist(next, updatedProfile);
      return { runOver: false, nextLevel: next.level };
    }

    const next = applyLoss(run);
    if (!isRunOver(next)) {
      set({ run: next });
      persist(next, profile);
      return { runOver: false, nextLevel: next.level };
    }

    const crowns = crownsForRun(next.highest);
    const updatedProfile: Profile = {
      ...profile,
      crowns: profile.crowns + crowns,
      runs: profile.runs + 1,
      bestLevel: Math.max(profile.bestLevel, next.highest),
    };
    set({
      run: null,
      profile: updatedProfile,
      summary: {
        highest: next.highest,
        streak: run.streak,
        crowns,
        newBest: next.highest > profile.bestLevel,
      },
    });
    persist(null, updatedProfile);
    return { runOver: true, nextLevel: next.level };
  },

  abandonRun() {
    set({ run: null });
    saveRun(null);
  },

  clearSummary() {
    set({ summary: null });
  },

  updateSettings(patch) {
    const profile = { ...get().profile, settings: { ...get().profile.settings, ...patch } };
    set({ profile });
    saveProfile(profile);
  },

  markTutorialSeen() {
    const profile = { ...get().profile, tutorialSeen: true };
    set({ profile });
    saveProfile(profile);
  },

  addCrowns(amount) {
    const profile = { ...get().profile, crowns: Math.max(0, get().profile.crowns + amount) };
    set({ profile });
    saveProfile(profile);
  },
}));

/** Meta upgrades change the starting run; phase 7 fills this in. */
function runOptionsFromProfile(_profile: Profile): Partial<RunState> {
  return {};
}
