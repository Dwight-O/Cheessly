import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureFeedback, cue } from './feedback';

afterEach(() => {
  vi.unstubAllGlobals();
  configureFeedback({ sound: true, haptics: true });
});

describe('feedback', () => {
  it('vibrates for a cue when haptics are on', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    configureFeedback({ sound: false, haptics: true });
    cue('capture');
    expect(vibrate).toHaveBeenCalledWith([18, 24, 18]);
  });

  it('stays silent when haptics are muted', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    configureFeedback({ sound: false, haptics: false });
    cue('move');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('does not throw without an AudioContext or vibration support', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', undefined);
    configureFeedback({ sound: true, haptics: true });
    expect(() => cue('win')).not.toThrow();
  });

  it('does not throw when vibration itself fails', () => {
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked by the platform');
      },
    });
    configureFeedback({ sound: false, haptics: true });
    expect(() => cue('loss')).not.toThrow();
  });
});
