import type { Piece } from '../../engine';

/** Solid glyphs for every piece; the *shape* carries the piece identity so the
 *  board stays readable without colour. */
const GLYPH: Record<Piece['type'], string> = {
  K: '♚',
  Q: '♛',
  R: '♜',
  B: '♝',
  N: '♞',
  P: '♟',
};

/**
 * Drawn as SVG so it scales with the square without any font-size maths, and
 * so the player/enemy distinction is a value contrast plus a second ring
 * rather than hue alone.
 *
 * Custom properties are applied through `style`, not through presentation
 * attributes: SVG attributes like `fill="var(--x)"` are not resolved.
 */
export default function PieceToken({ piece }: { piece: Piece }) {
  const player = piece.color === 'w';
  const body = player ? 'var(--player)' : 'var(--enemy)';
  const ink = player ? 'var(--player-ink)' : 'var(--enemy-ink)';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="41" style={{ fill: body, stroke: ink, strokeWidth: 4 }} />
      {!player && (
        <circle cx="50" cy="50" r="33" style={{ fill: 'none', stroke: ink, strokeWidth: 2.5 }} />
      )}
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="54"
        style={{ fill: ink }}
      >
        {GLYPH[piece.type]}
      </text>
    </svg>
  );
}
