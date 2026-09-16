import { useAppStore } from '../../state/appStore';
import { openCurrentLevel, startNewRun } from '../../state/flow';
import { useRunStore } from '../../state/runStore';
import ui from '../styles/ui.module.css';

export default function HomeScreen() {
  const run = useRunStore((s) => s.run);
  const profile = useRunStore((s) => s.profile);
  const go = useAppStore((s) => s.go);

  return (
    <div className={`${ui.screen} ${ui.centred}`}>
      <h1 className={ui.brand}>
        King&apos;s <span>Ladder</span>
      </h1>
      <p className={ui.tagline}>Capture the king. Climb. Keep your hearts.</p>

      <div className={ui.panel}>
        <div className={ui.stats}>
          <div>
            <span className={ui.statValue}>{profile.bestLevel}</span>
            <span className={ui.statLabel}>Best level</span>
          </div>
          <div>
            <span className={ui.statValue}>{profile.bestStreak}</span>
            <span className={ui.statLabel}>Best streak</span>
          </div>
          <div>
            <span className={ui.statValue}>{profile.crowns}</span>
            <span className={ui.statLabel}>Crowns</span>
          </div>
        </div>
      </div>

      <div className={ui.actions}>
        {run ? (
          <>
            <button type="button" className={ui.primary} onClick={openCurrentLevel}>
              Continue — Level {run.level}
            </button>
            <button type="button" className={ui.secondary} onClick={() => startNewRun()}>
              New run
            </button>
          </>
        ) : (
          <button type="button" className={ui.primary} onClick={() => startNewRun()}>
            Start run
          </button>
        )}
        <div className={ui.linkRow}>
          <button type="button" className={ui.secondary} onClick={() => go('daily')} disabled>
            Daily
          </button>
          <button type="button" className={ui.secondary} onClick={() => go('upgrades')} disabled>
            Upgrades
          </button>
        </div>
      </div>
    </div>
  );
}
