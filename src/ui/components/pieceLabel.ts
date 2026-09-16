import { PIECE_NAME } from '../../engine';
import type { Piece } from '../../engine';

/** Spoken description of a piece, used in square ARIA labels. */
export function pieceLabel(piece: Piece): string {
  return `${piece.color === 'w' ? 'your' : 'enemy'} ${PIECE_NAME[piece.type]}`;
}
