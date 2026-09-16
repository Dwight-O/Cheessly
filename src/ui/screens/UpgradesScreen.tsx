import { useAppStore } from '../../state/appStore';
import { useRunStore } from '../../state/runStore';
import { nextCost, ownedLevel, UPGRADES } from '../../state/upgrades';
import ui from '../styles/ui.module.css';
import styles from './UpgradesScreen.module.css';

export default function UpgradesScreen() {
  const go = useAppStore((s) => s.go);
  const profile = useRunStore((s) => s.profile);
  const buyUpgrade = useRunStore((s) => s.buyUpgrade);
  const run = useRunStore((s) => s.run);

  return (
    <div className={ui.screen}>
      <h1 className={ui.brand}>Upgrades</h1>
      <p className={ui.tagline}>
        {profile.crowns} Crowns. Spent between runs — the enemy gets a matching budget, so the
        ladder stays a climb.
      </p>
      {run && <p className={styles.warning}>Changes apply to your next run.</p>}

      <ul className={styles.list}>
        {UPGRADES.map((upgrade) => {
          const owned = ownedLevel(profile, upgrade.id);
          const cost = nextCost(profile, upgrade.id);
          const maxed = cost === null;
          return (
            <li key={upgrade.id} className={ui.panel}>
              <div className={styles.head}>
                <span className={styles.name}>{upgrade.name}</span>
                <span className={styles.owned}>
                  {owned}/{upgrade.maxLevel}
                </span>
              </div>
              <p className={styles.description}>{upgrade.description}</p>
              <button
                type="button"
                className={ui.secondary}
                disabled={maxed || profile.crowns < cost}
                onClick={() => buyUpgrade(upgrade.id)}
              >
                {maxed ? 'Owned' : `Buy — ${cost} Crowns`}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={ui.actions}>
        <button type="button" className={ui.primary} onClick={() => go('home')}>
          Done
        </button>
      </div>
    </div>
  );
}
