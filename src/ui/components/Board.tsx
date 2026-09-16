import { isBlocked, pieceAt, squareName, squareX, squareY } from '../../engine';
import type { GameState, Move, Square } from '../../engine';
import PieceToken from './PieceToken';
import { pieceLabel } from './pieceLabel';
import styles from './Board.module.css';

interface BoardProps {
  game: GameState;
  selected: Square | null;
  targets: readonly Move[];
  interactive: boolean;
  onTapSquare: (square: Square) => void;
}

function squareLabel(game: GameState, square: Square, target: Move | undefined): string {
  const parts = [squareName(game.board, square)];
  if (isBlocked(game.board, square)) parts.push('blocked');
  const piece = pieceAt(game.board, square);
  if (piece) parts.push(pieceLabel(piece));
  else if (!isBlocked(game.board, square)) parts.push('empty');
  if (target) parts.push(target.captured ? 'capture here' : 'move here');
  return parts.join(', ');
}

export default function Board({ game, selected, targets, interactive, onTapSquare }: BoardProps) {
  const { board } = game;
  const squares = board.cells.map((_, square) => square);
  const targetBySquare = new Map(targets.map((move) => [move.to, move]));

  const style = {
    '--cols': board.width,
    '--rows': board.height,
    aspectRatio: `${board.width} / ${board.height}`,
  } as React.CSSProperties;

  return (
    <div className={styles.wrap} style={style}>
      <div className={styles.grid} role="group" aria-label="Game board">
        {squares.map((square) => {
          const x = squareX(board, square);
          const y = squareY(board, square);
          const target = targetBySquare.get(square);
          const classes = [styles.square];
          if ((x + y) % 2 === 0) classes.push(styles.light);
          if (isBlocked(board, square)) classes.push(styles.blocked);
          if (game.lastMove?.from === square) classes.push(styles.lastFrom);
          if (game.lastMove?.to === square) classes.push(styles.lastTo);
          if (selected === square) classes.push(styles.selected);
          if (target) classes.push(target.captured ? styles.capture : styles.target);
          return (
            <button
              key={square}
              type="button"
              className={classes.join(' ')}
              aria-label={squareLabel(game, square, target)}
              aria-pressed={selected === square}
              disabled={!interactive}
              onClick={() => onTapSquare(square)}
            />
          );
        })}
      </div>

      <div className={styles.pieces} aria-hidden="true">
        {squares.map((square) => {
          const piece = pieceAt(board, square);
          if (!piece) return null;
          const x = squareX(board, square);
          const y = squareY(board, square);
          const moved = game.lastMove?.to === square;
          // The piece that just moved is keyed by ply so React remounts it and
          // the slide-in animation replays from its origin square.
          return (
            <div
              key={moved ? `${square}:${game.ply}` : square}
              className={`${styles.piece} ${moved ? styles.moving : ''}`}
              style={
                {
                  left: `calc(${x} * 100% / var(--cols))`,
                  top: `calc(${y} * 100% / var(--rows))`,
                  ...(moved && game.lastMove
                    ? {
                        '--dx': `${squareX(board, game.lastMove.from) - x}00%`,
                        '--dy': `${squareY(board, game.lastMove.from) - y}00%`,
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              <PieceToken piece={piece} />
            </div>
          );
        })}
        {game.lastMove?.captured && (
          <div
            key={`capture:${game.ply}`}
            className={`${styles.piece} ${styles.captureBurst}`}
            style={{
              left: `calc(${squareX(board, game.lastMove.to)} * 100% / var(--cols))`,
              top: `calc(${squareY(board, game.lastMove.to)} * 100% / var(--rows))`,
            }}
          />
        )}
      </div>
    </div>
  );
}
