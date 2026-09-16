import { useMemo, useState } from 'react';
import Board from '../components/Board';
import { createGame, parseBoard } from '../../engine';
import { getLevel, levelRules, validateLevel } from '../../levels';
import { useAppStore } from '../../state/appStore';
import { useGameStore } from '../../state/gameStore';
import ui from '../styles/ui.module.css';
import styles from './DevScreen.module.css';

/** Dev-only: preview and play any level number on any seed. */
export default function DevScreen() {
  const go = useAppStore((s) => s.go);
  const startLevel = useGameStore((s) => s.startLevel);
  const [index, setIndex] = useState(1);
  const [seed, setSeed] = useState(1);
  const [extraKnight, setExtraKnight] = useState(false);

  const level = useMemo(() => getLevel(index, seed, { extraKnight }), [index, seed, extraKnight]);
  const validation = useMemo(() => validateLevel(level), [level]);
  const game = useMemo(() => createGame(parseBoard(level.rows), levelRules(level)), [level]);

  return (
    <div className={ui.screen}>
      <h1>Level preview</h1>

      <div className={styles.row}>
        <label htmlFor="dev-level">Level</label>
        <button
          type="button"
          className={styles.step}
          onClick={() => setIndex((n) => Math.max(1, n - 1))}
        >
          −
        </button>
        <input
          id="dev-level"
          className={styles.input}
          type="number"
          min={1}
          max={999}
          value={index}
          onChange={(event) => setIndex(Math.max(1, Number(event.target.value) || 1))}
        />
        <button type="button" className={styles.step} onClick={() => setIndex((n) => n + 1)}>
          +
        </button>
      </div>

      <div className={styles.row}>
        <label htmlFor="dev-seed">Seed</label>
        <input
          id="dev-seed"
          className={styles.input}
          type="number"
          value={seed}
          onChange={(event) => setSeed(Number(event.target.value) || 0)}
        />
        <label htmlFor="dev-knight">Knight</label>
        <input
          id="dev-knight"
          type="checkbox"
          checked={extraKnight}
          onChange={(event) => setExtraKnight(event.target.checked)}
        />
      </div>

      <Board game={game} selected={null} targets={[]} interactive={false} onTapSquare={() => {}} />

      <div className={ui.panel}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th>Name</th>
              <td>
                {level.name}
                {level.isBoss ? ' (boss)' : ''}
              </td>
            </tr>
            <tr>
              <th>Source</th>
              <td>{index <= 30 ? 'hand-tuned' : 'generated'}</td>
            </tr>
            <tr>
              <th>Board</th>
              <td>
                {game.board.width}x{game.board.height}
              </td>
            </tr>
            <tr>
              <th>AI depth / mistake</th>
              <td>
                {level.aiDepth} / {Math.round(level.mistakeChance * 100)}%
              </td>
            </tr>
            <tr>
              <th>Move limit</th>
              <td>{level.moveLimit ?? '—'}</td>
            </tr>
            <tr>
              <th>Move timer</th>
              <td>{level.moveTimerSeconds ? `${level.moveTimerSeconds}s` : '—'}</td>
            </tr>
            <tr>
              <th>Enemy double move</th>
              <td>{level.enemyDoubleMoveEvery ? `every ${level.enemyDoubleMoveEvery}` : '—'}</td>
            </tr>
            <tr>
              <th>Valid</th>
              <td className={validation.ok ? styles.ok : styles.bad}>
                {validation.ok ? 'yes' : validation.problems.join('; ')}
              </td>
            </tr>
            <tr>
              <th>Warnings</th>
              <td>{validation.warnings.length ? validation.warnings.join('; ') : '—'}</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.mono}>{level.rows.join('\n')}</p>
      </div>

      <div className={ui.actions}>
        <button
          type="button"
          className={ui.primary}
          onClick={() => {
            startLevel(level, seed, 'preview');
            go('game');
          }}
        >
          Play this level
        </button>
        <button type="button" className={ui.secondary} onClick={() => go('home')}>
          Back
        </button>
      </div>
    </div>
  );
}
