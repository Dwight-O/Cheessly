import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunStore } from './runStore';
import { DEFAULT_PROFILE } from './profile';

/** An in-memory localStorage so persistence is exercised in tests. */
function stubStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage);
  return map;
}

const store = () => useRunStore.getState();

describe('runStore', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    stubStorage();
    useRunStore.setState({ run: null, profile: { ...DEFAULT_PROFILE }, summary: null });
  });

  it('starts a run and persists it', () => {
    store().startRun(7);
    expect(store().run?.seed).toBe(7);
    useRunStore.setState({ run: null });
    store().hydrate();
    expect(store().run?.seed).toBe(7);
  });

  it('advances a level on a win and records the best level', () => {
    store().startRun(1);
    const result = store().recordResult('player-win');
    expect(result).toEqual({ runOver: false, nextLevel: 2 });
    expect(store().profile.bestLevel).toBe(2);
  });

  it('replays the same level on a draw with no penalty', () => {
    store().startRun(1);
    store().recordResult('player-win');
    const before = store().run!;
    const result = store().recordResult('draw');
    expect(result.nextLevel).toBe(before.level);
    expect(store().run?.hearts).toBe(before.hearts);
  });

  it('ends the run and awards crowns when the last heart goes', () => {
    store().startRun(1);
    for (let i = 0; i < 4; i++) store().recordResult('player-win'); // level 5
    store().recordResult('player-loss');
    store().recordResult('player-loss');
    const last = store().recordResult('player-loss');
    expect(last.runOver).toBe(true);
    expect(store().run).toBeNull();
    expect(store().summary?.highest).toBe(5);
    expect(store().summary?.crowns).toBe(10);
    expect(store().profile.crowns).toBe(10);
    expect(store().profile.runs).toBe(1);
  });

  it('clears the saved run once it is over', () => {
    store().startRun(1);
    for (let i = 0; i < 3; i++) store().recordResult('player-loss');
    store().hydrate();
    expect(store().run).toBeNull();
  });

  it('persists settings and the tutorial flag', () => {
    store().updateSettings({ sound: false });
    store().markTutorialSeen();
    store().hydrate();
    expect(store().profile.settings.sound).toBe(false);
    expect(store().profile.settings.haptics).toBe(true);
    expect(store().profile.tutorialSeen).toBe(true);
  });

  it('survives a storage failure without throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage);
    expect(() => store().startRun(3)).not.toThrow();
    expect(() => store().recordResult('player-win')).not.toThrow();
    expect(() => store().hydrate()).not.toThrow();
  });
});
