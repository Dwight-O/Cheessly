import { useEffect, useState } from 'react';
import styles from './MoveTimer.module.css';

interface MoveTimerProps {
  /** Seconds allowed per player move. */
  seconds: number;
  /** Changes whenever a new player turn starts, restarting the countdown. */
  turnKey: number;
  active: boolean;
  onExpire: () => void;
}

/**
 * Counts down the per-move timer. It works from a deadline rather than by
 * decrementing, so a backgrounded tab cannot drift.
 */
export default function MoveTimer({ seconds, turnKey, active, onExpire }: MoveTimerProps) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setLeft(seconds);
      return;
    }
    const deadline = Date.now() + seconds * 1000;
    setLeft(seconds);
    const id = setInterval(() => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 100);
    return () => clearInterval(id);
    // onExpire is stable (a store action); turnKey restarts the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, turnKey, active]);

  const fraction = Math.max(0, Math.min(1, left / seconds));
  return (
    <div className={styles.bar} role="timer" aria-label={`${Math.ceil(left)} seconds left to move`}>
      <div
        className={`${styles.fill} ${fraction < 0.3 ? styles.urgent : ''}`}
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}
