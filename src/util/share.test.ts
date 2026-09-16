import { describe, expect, it, vi } from 'vitest';
import { dailyShareText, runShareText, shareText } from './share';

describe('share cards', () => {
  it('formats the daily card', () => {
    expect(
      dailyShareText('2026-09-16', ['win', 'win', 'loss', 'win', 'win'], 5, 7, 'https://x.test/'),
    ).toBe(
      "King's Ladder ♔ Daily 2026-09-16\n" +
        '\u{1F7E9}\u{1F7E9}\u{1F7E5}\u{1F7E9}\u{1F7E9}  4/5\n' +
        'Streak: 7 \u{1F525}\n' +
        'https://x.test/',
    );
  });

  it('formats the endless card', () => {
    expect(runShareText(22, 2, 3, 'https://x.test/')).toBe(
      '♔ Reached Level 22 | ❤️❤️\u{1F5A4}\nhttps://x.test/',
    );
  });

  it('omits the url when there is none', () => {
    expect(runShareText(3, 1, 1, '')).toBe('♔ Reached Level 3 | ❤️');
  });
});

describe('shareText', () => {
  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    expect(await shareText('hello')).toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: 'hello' });
    vi.unstubAllGlobals();
  });

  it('falls back to the clipboard when sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await shareText('hello')).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('hello');
    vi.unstubAllGlobals();
  });

  it('falls back to the clipboard when the share sheet is dismissed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('cancelled')),
      clipboard: { writeText },
    });
    expect(await shareText('hello')).toBe('copied');
    vi.unstubAllGlobals();
  });

  it('reports failure when nothing works', async () => {
    vi.stubGlobal('navigator', {});
    expect(await shareText('hello')).toBe('failed');
    vi.unstubAllGlobals();
  });
});
