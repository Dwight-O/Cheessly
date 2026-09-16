import { useEffect, useState } from 'react';
import ShareButton from '../components/ShareButton';
import {
  DAILY_LEVEL_COUNT,
  dailyScore,
  formatCountdown,
  isDailyComplete,
  msUntilNextDaily,
  todayUtc,
} from '../../state/daily';
import { useAppStore } from '../../state/appStore';
import { useDailyStore } from '../../state/dailyStore';
import { startDaily } from '../../state/flow';
import { dailyShareText } from '../../util/share';
import ui from '../styles/ui.module.css';
import styles from './DailyScreen.module.css';

export default function DailyScreen() {
  const go = useAppStore((s) => s.go);
  const state = useDailyStore((s) => s.state);
  const [date] = useState(todayUtc);
  const [countdown, setCountdown] = useState(() => msUntilNextDaily());

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilNextDaily()), 1000);
    return () => clearInterval(id);
  }, []);

  const played = state.date === date ? state.results : [];
  const complete = isDailyComplete(state, date);
  const score = dailyScore({ ...state, results: played });
  const squares =
    played.map((result) => (result === 'win' ? '\u{1F7E9}' : '\u{1F7E5}')).join('') +
    '⬜'.repeat(DAILY_LEVEL_COUNT - played.length);

  return (
    <div className={`${ui.screen} ${ui.centred}`}>
      <h1 className={ui.brand}>Daily</h1>
      <p className={ui.tagline}>{date} — the same five levels for everyone.</p>

      <div className={ui.panel}>
        <p className={styles.squares} aria-label={`${score} of ${DAILY_LEVEL_COUNT} cleared`}>
          {squares}
        </p>
        <p className={styles.score}>
          {played.length > 0 ? `${score}/${DAILY_LEVEL_COUNT}` : 'Not started'}
        </p>
        <div className={ui.stats}>
          <div>
            <span className={ui.statValue}>{state.streak}</span>
            <span className={ui.statLabel}>Streak</span>
          </div>
          <div>
            <span className={ui.statValue}>{state.bestStreak}</span>
            <span className={ui.statLabel}>Best streak</span>
          </div>
          <div>
            <span className={`${ui.statValue} ${styles.countdown}`}>
              {formatCountdown(countdown)}
            </span>
            <span className={ui.statLabel}>Next daily</span>
          </div>
        </div>
      </div>

      {complete && (
        <div className={ui.panel}>
          <p className={styles.card}>
            {dailyShareText(date, played, DAILY_LEVEL_COUNT, state.streak)}
          </p>
        </div>
      )}

      <div className={ui.actions}>
        {complete ? (
          <ShareButton
            text={dailyShareText(date, played, DAILY_LEVEL_COUNT, state.streak)}
            label="Share result"
          />
        ) : (
          <button type="button" className={ui.primary} onClick={startDaily}>
            {played.length > 0 ? `Continue (${played.length}/${DAILY_LEVEL_COUNT})` : 'Play daily'}
          </button>
        )}
        <button type="button" className={ui.secondary} onClick={() => go('home')}>
          Home
        </button>
      </div>
    </div>
  );
}
