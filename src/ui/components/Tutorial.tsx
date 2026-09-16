import { useState } from 'react';
import ui from '../styles/ui.module.css';
import styles from './Tutorial.module.css';

const STEPS = [
  {
    title: 'Tap, then tap',
    body: 'Tap one of your pieces to see where it can go, then tap a highlighted square. Dots are moves, rings are captures.',
  },
  {
    title: 'Take the king',
    body: 'There is no check and no checkmate here. Capture the enemy king and the level is yours — but your king can be taken just as easily.',
  },
  {
    title: 'Mind your hearts',
    body: 'Win to climb a level. Lose and you drop one level and one heart, never below your last checkpoint. At zero hearts the run ends and you bank Crowns.',
  },
];

/** Shown once, on first launch. */
export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  if (!current) return null;
  const last = step === STEPS.length - 1;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="How to play">
      <div className={styles.card}>
        <p className={styles.counter}>
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.body}>{current.body}</p>
        <button
          type="button"
          className={ui.primary}
          onClick={() => (last ? onDone() : setStep((n) => n + 1))}
        >
          {last ? 'Play' : 'Next'}
        </button>
        {!last && (
          <button type="button" className={styles.skip} onClick={onDone}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
