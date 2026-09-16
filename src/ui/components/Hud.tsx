import { isBossLevel } from '../../state/run';
import type { Profile } from '../../state/profile';
import type { RunState } from '../../state/run';
import styles from './Hud.module.css';

interface HudProps {
  run: RunState;
  profile: Profile;
  onQuit: () => void;
}

function hearts(current: number, max: number): string {
  return '♥'.repeat(current) + '♡'.repeat(Math.max(0, max - current));
}

/** Always-visible run status: level, hearts, best level and streak. */
export default function Hud({ run, profile, onQuit }: HudProps) {
  const boss = isBossLevel(run.level);
  return (
    <div className={styles.hud}>
      <div className={styles.left}>
        <span className={`${styles.level} ${boss ? styles.boss : ''}`}>
          {boss ? 'Boss ' : ''}Lv {run.level}
        </span>
        <span className={styles.hearts} aria-label={`${run.hearts} of ${run.maxHearts} hearts`}>
          {hearts(run.hearts, run.maxHearts)}
        </span>
      </div>
      <div className={styles.right}>
        <span className={styles.dim} aria-label={`streak ${run.streak}`}>
          {run.streak > 0 ? `\u{1F525}${run.streak}` : '\u{1F525}0'}
        </span>
        <span className={styles.dim} aria-label={`best level ${profile.bestLevel}`}>
          Best {profile.bestLevel}
        </span>
        <button type="button" className={styles.quit} onClick={onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}
