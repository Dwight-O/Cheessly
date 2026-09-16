import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readJson, removeKey, writeJson } from './storage';

function installStorage(impl: Partial<Storage>) {
  vi.stubGlobal('localStorage', impl as Storage);
}

describe('storage', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('round-trips values', () => {
    const map = new Map<string, string>();
    installStorage({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
    });
    expect(writeJson('save', { level: 4 })).toBe(true);
    expect(readJson('save', null)).toEqual({ level: 4 });
    expect(removeKey('save')).toBe(true);
    expect(readJson('save', 'gone')).toBe('gone');
  });

  it('returns the fallback when reading throws', () => {
    installStorage({
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readJson('save', 'fallback')).toBe('fallback');
  });

  it('returns false instead of throwing when writing fails (quota)', () => {
    installStorage({
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(writeJson('save', { a: 1 })).toBe(false);
  });

  it('returns the fallback for corrupt JSON', () => {
    installStorage({ getItem: () => '{not json' });
    expect(readJson('save', 42)).toBe(42);
  });
});
