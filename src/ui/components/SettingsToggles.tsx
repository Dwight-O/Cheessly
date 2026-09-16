import { useRunStore } from '../../state/runStore';
import styles from './SettingsToggles.module.css';

/** Mute toggles for the two feedback channels. */
export default function SettingsToggles() {
  const settings = useRunStore((s) => s.profile.settings);
  const updateSettings = useRunStore((s) => s.updateSettings);

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={settings.sound}
        onClick={() => updateSettings({ sound: !settings.sound })}
      >
        {settings.sound ? '\u{1F50A}' : '\u{1F507}'} Sound
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={settings.haptics}
        onClick={() => updateSettings({ haptics: !settings.haptics })}
      >
        {settings.haptics ? '\u{1F4F3}' : '\u{1F4F4}'} Haptics
      </button>
    </div>
  );
}
