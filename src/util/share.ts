/** Share-card text and the one-tap share, with a clipboard fallback. */

export type ShareOutcome = 'shared' | 'copied' | 'failed';

/** The address to put on a share card. Empty outside a browser. */
export function gameUrl(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`.replace(/index\.html$/, '');
}

export function dailyShareText(
  date: string,
  results: readonly ('win' | 'loss')[],
  total: number,
  streak: number,
  url: string = gameUrl(),
): string {
  const squares = results.map((result) => (result === 'win' ? '\u{1F7E9}' : '\u{1F7E5}')).join('');
  const score = results.filter((result) => result === 'win').length;
  const lines = [
    `King's Ladder ♔ Daily ${date}`,
    `${squares}  ${score}/${total}`,
    `Streak: ${streak} \u{1F525}`,
  ];
  if (url) lines.push(url);
  return lines.join('\n');
}

export function runShareText(
  highestLevel: number,
  hearts: number,
  maxHearts: number,
  url: string = gameUrl(),
): string {
  const life =
    '❤️'.repeat(Math.max(0, hearts)) + '\u{1F5A4}'.repeat(Math.max(0, maxHearts - hearts));
  const line = `♔ Reached Level ${highestLevel} | ${life}`;
  return url ? `${line}\n${url}` : line;
}

/**
 * Web Share where it exists, clipboard otherwise. A share the user cancels
 * reports `failed`, which the UI treats as "nothing happened".
 */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // Fall through to the clipboard: the user may have dismissed the sheet,
      // or the platform may refuse text-only shares.
    }
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    return 'failed';
  }
  return 'failed';
}
