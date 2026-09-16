/**
 * localStorage access. Every read and write is wrapped in try/catch: Safari
 * private mode, disabled storage and quota errors must never crash the game.
 */

const PREFIX = 'kingsladder:';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): boolean {
  try {
    globalThis.localStorage?.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}
