import { useEffect } from 'react';
import Board from '../components/Board';
import { movesLeft } from '../../engine';
import { useGameStore } from '../../state/gameStore';
import styles from './GameScreen.module.css';

const RESULT_TEXT = {
  'player-win': { title: 'Level cleared', body: 'You captured the enemy king.' },
  'player-loss': { title: 'Defeated', body: 'Your king fell.' },
  draw: { title: 'Out of moves', body: 'Nobody captured a king. Replay, no penalty.' },
} as const;

interface GameScreenProps {
  /** What the button under the result overlay does. */
  onContinue: () => void;
}

export default function GameScreen({ onContinue }: GameScreenProps) {
  const level = useGameStore((s) => s.level);
  const game = useGameStore((s) => s.game);
  const selected = useGameStore((s) => s.selected);
  const targets = useGameStore((s) => s.targets);
  const enemyThinking = useGameStore((s) => s.enemyThinking);
  const tapSquare = useGameStore((s) => s.tapSquare);
  const playEnemyTurn = useGameStore((s) => s.playEnemyTurn);

  useEffect(() => {
    if (game && game.status === 'playing' && game.turn === 'b') void playEnemyTurn();
  }, [game, playEnemyTurn]);

  if (!level || !game) return null;

  const remaining = movesLeft(game);
  const over = game.status !== 'playing';
  const result = over ? RESULT_TEXT[game.status as keyof typeof RESULT_TEXT] : null;

  return (
    <div className={styles.screen}>
      <header>
        <h1 className={styles.title}>
          Level {level.index} — {level.name}
        </h1>
        {level.note && <p className={styles.note}>{level.note}</p>}
      </header>

      <div className={styles.status} aria-live="polite">
        <span>
          {over ? '' : game.turn === 'w' ? 'Your move' : ''}
          {!over && game.turn === 'b' && <span className={styles.thinking}>Enemy thinking</span>}
        </span>
        <span>{remaining !== null ? `${remaining} moves left` : ''}</span>
      </div>

      <div className={styles.boardArea}>
        <Board
          game={game}
          selected={selected}
          targets={targets}
          interactive={!over && game.turn === 'w' && !enemyThinking}
          onTapSquare={tapSquare}
        />
        {result && (
          <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.overlayInner}>
              <h2>{result.title}</h2>
              <p>{result.body}</p>
              <button type="button" className={styles.primary} onClick={onContinue}>
                {game.status === 'player-win' ? 'Next level' : 'Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
