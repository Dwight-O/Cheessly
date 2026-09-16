import ShareButton from '../components/ShareButton';
import { runShareText } from '../../util/share';
import { useAppStore } from '../../state/appStore';
import { startNewRun } from '../../state/flow';
import { useRunStore } from '../../state/runStore';
import ui from '../styles/ui.module.css';

export default function RunEndScreen() {
  const summary = useRunStore((s) => s.summary);
  const profile = useRunStore((s) => s.profile);
  const go = useAppStore((s) => s.go);

  if (!summary) {
    return (
      <div className={`${ui.screen} ${ui.centred}`}>
        <button type="button" className={ui.primary} onClick={() => go('home')}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className={`${ui.screen} ${ui.centred}`}>
      <h1 className={ui.brand}>Run over</h1>
      <p className={ui.tagline}>
        {summary.newBest ? 'A new personal best.' : 'The ladder wins this time.'}
      </p>

      <div className={ui.panel}>
        <div className={ui.stats}>
          <div>
            <span className={ui.statValue}>{summary.highest}</span>
            <span className={ui.statLabel}>Level reached</span>
          </div>
          <div>
            <span className={ui.statValue}>+{summary.crowns}</span>
            <span className={ui.statLabel}>Crowns earned</span>
          </div>
          <div>
            <span className={ui.statValue}>{profile.crowns}</span>
            <span className={ui.statLabel}>Crowns total</span>
          </div>
        </div>
      </div>

      <div className={ui.actions}>
        <button type="button" className={ui.primary} onClick={() => startNewRun()}>
          Run again
        </button>
        <ShareButton text={runShareText(summary.highest, 0, summary.maxHearts)} label="Share run" />
        <button type="button" className={ui.secondary} onClick={() => go('home')}>
          Home
        </button>
      </div>
    </div>
  );
}
