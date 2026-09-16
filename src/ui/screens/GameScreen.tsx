import { useEffect, useRef } from 'react';
import Board from '../components/Board';
import Hud from '../components/Hud';
import MoveTimer from '../components/MoveTimer';
import Tutorial from '../components/Tutorial';
import { movesLeft } from '../../engine';
import type { Square } from '../../engine';
import { useAppStore } from '../../state/appStore';
import { advanceAfterLevel, advanceDaily, quitToHome, undoMove } from '../../state/flow';
import { useGameStore } from '../../state/gameStore';
import { useRunStore } from '../../state/runStore';
import { cue } from '../feedback';
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
  const history = useGameStore((s) => s.history);
  const tapSquare = useGameStore((s) => s.tapSquare);
  const playEnemyTurn = useGameStore((s) => s.playEnemyTurn);
  const playTimeoutMove = useGameStore((s) => s.playTimeoutMove);
  const run = useRunStore((s) => s.run);
  const profile = useRunStore((s) => s.profile);
  const markTutorialSeen = useRunStore((s) => s.markTutorialSeen);
  const go = useAppStore((s) => s.go);

  const lastPly = useRef(0);
  const status = game?.status;
  const ply = game?.ply ?? 0;
  const captured = game?.lastMove?.captured;

  useEffect(() => {
    if (game && game.status === 'playing' && game.turn === 'b') void playEnemyTurn();
  }, [game, playEnemyTurn]);

  // Sound and haptics follow the position, so a move made by the timer or the
  // AI feels the same as one the player tapped.
  useEffect(() => {
    if (ply > lastPly.current) cue(captured ? 'capture' : 'move');
    lastPly.current = ply;
  }, [ply, captured]);

  useEffect(() => {
    if (status === 'player-win') cue('win');
    else if (status === 'player-loss') cue('loss');
  }, [status]);

  if (!level || !game) return null;

  const remaining = movesLeft(game);
  const over = game.status !== 'playing';
  const result = over ? RESULT[game.status as keyof typeof RESULT] : null;
  const playerToMove = !over && game.turn === 'w' && !enemyThinking;

  const onTap = (square: Square) => {
    cue('select');
    tapSquare(square);
  };

  const onContinue = () => {
    if (mode === 'preview') go('dev');
    else if (mode === 'daily') advanceDaily(game.status);
    else advanceAfterLevel(game.status);
  };

  return (
    <div className={styles.screen}>
      {mode === 'run' && run ? (
        <Hud run={run} profile={profile} onQuit={quitToHome} />
      ) : (
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
          {over ? result?.title : game.turn === 'w' ? 'Your move' : null}
          {!over && game.turn === 'b' && <span className={styles.thinking}>Enemy thinking</span>}
        </span>
        <span>{remaining !== null ? `${remaining} moves left` : ''}</span>
      </div>

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
          onTapSquare={onTap}
        />
        {result && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <h2>{result.title}</h2>
              <p>{result.body}</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        {result ? (
          <button type="button" className={styles.primary} onClick={onContinue} autoFocus>
            {mode === 'preview' ? 'Back to preview' : result.cta}
          </button>
        ) : (
          mode === 'run' &&
          run &&
          run.undosLeft > 0 && (
            <button
              type="button"
              className={styles.undo}
              disabled={history.length === 0 || !playerToMove}
              onClick={() => undoMove()}
            >
              Undo ({run.undosLeft})
            </button>
          )
        )}
      </div>

      {!profile.tutorialSeen && <Tutorial onDone={markTutorialSeen} />}
    </div>
  );
}
