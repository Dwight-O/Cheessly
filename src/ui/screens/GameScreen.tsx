import { useEffect } from 'react';
import Board from '../components/Board';
import Hud from '../components/Hud';
import MoveTimer from '../components/MoveTimer';
import { movesLeft } from '../../engine';
import { useAppStore } from '../../state/appStore';
import { advanceAfterLevel, advanceDaily, quitToHome, undoMove } from '../../state/flow';
import { useGameStore } from '../../state/gameStore';
import { useRunStore } from '../../state/runStore';
import styles from './GameScreen.module.css';

const RESULT = {
  'player-win': { title: 'Level cleared', body: 'You captured the enemy king.', cta: 'Next level' },
  'player-loss': { title: 'Defeated', body: 'You lose a heart and drop a level.', cta: 'Continue' },
  draw: { title: 'Out of moves', body: 'A draw. Replay this level, no penalty.', cta: 'Replay' },
} as const;

export default function GameScreen() {
  const level = useGameStore((s) => s.level);
  const game = useGameStore((s) => s.game);
  const selected = useGameStore((s) => s.selected);
  const targets = useGameStore((s) => s.targets);
  const enemyThinking = useGameStore((s) => s.enemyThinking);
  const mode = useGameStore((s) => s.mode);
  const playTimeoutMove = useGameStore((s) => s.playTimeoutMove);
  const history = useGameStore((s) => s.history);
  const go = useAppStore((s) => s.go);
  const tapSquare = useGameStore((s) => s.tapSquare);
  const playEnemyTurn = useGameStore((s) => s.playEnemyTurn);
  const run = useRunStore((s) => s.run);
  const profile = useRunStore((s) => s.profile);

  useEffect(() => {
    if (game && game.status === 'playing' && game.turn === 'b') void playEnemyTurn();
  }, [game, playEnemyTurn]);

  if (!level || !game) return null;

  const remaining = movesLeft(game);
  const over = game.status !== 'playing';
  const result = over ? RESULT[game.status as keyof typeof RESULT] : null;
  const playerToMove = !over && game.turn === 'w' && !enemyThinking;
  const onContinue = () => {
    if (mode === 'preview') go('dev');
    else if (mode === 'daily') advanceDaily(game.status);
    else advanceAfterLevel(game.status);
  };

  return (
    <div className={styles.screen}>
      {mode === 'run' && run && <Hud run={run} profile={profile} onQuit={quitToHome} />}
      {mode !== 'run' && (
        <div className={styles.status}>
          <span>{mode === 'daily' ? 'Daily challenge' : 'Level preview'}</span>
          <button
            type="button"
            className={styles.quit}
            onClick={() => go(mode === 'daily' ? 'daily' : 'dev')}
          >
            Back
          </button>
        </div>
      )}

      <header>
        <h1 className={styles.title}>{level.name}</h1>
        {level.note && <p className={styles.note}>{level.note}</p>}
      </header>

      <div className={styles.status} aria-live="polite">
        <span>
          {over ? '' : game.turn === 'w' ? 'Your move' : null}
          {!over && game.turn === 'b' && <span className={styles.thinking}>Enemy thinking</span>}
        </span>
        <span>{remaining !== null ? `${remaining} moves left` : ''}</span>
      </div>

      {mode === 'run' && run && run.undosLeft > 0 && (
        <button
          type="button"
          className={styles.undo}
          disabled={history.length === 0 || !playerToMove}
          onClick={() => undoMove()}
        >
          Undo ({run.undosLeft})
        </button>
      )}

      {level.moveTimerSeconds !== undefined && (
        <MoveTimer
          seconds={level.moveTimerSeconds}
          turnKey={game.ply}
          active={playerToMove}
          onExpire={playTimeoutMove}
        />
      )}

      <div className={styles.boardArea}>
        <Board
          game={game}
          selected={selected}
          targets={targets}
          interactive={playerToMove}
          onTapSquare={tapSquare}
        />
        {result && (
          <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.overlayInner}>
              <h2>{result.title}</h2>
              <p>{result.body}</p>
              <button type="button" className={styles.primary} onClick={onContinue}>
                {mode === 'preview' ? 'Back to preview' : result.cta}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
