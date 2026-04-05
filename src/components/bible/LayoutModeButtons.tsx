import { useSettings } from '@/components/SettingsContext';
import type { LayoutMode } from '@/lib/settings';
import styles from './LayoutModeButtons.module.scss';

const modes: { value: LayoutMode; label: string; title: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', title: 'Normal visning (N)', icon: '☰' },
  { value: 'reading', label: 'Lesemodus', title: 'Lesemodus (R)', icon: '📖' },
  { value: 'panel', label: 'Panelmodus', title: 'Panelmodus (P)', icon: '▥' },
];

export function LayoutModeButtons() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className={styles.group} role="radiogroup" aria-label="Visningsmodus">
      {modes.map(mode => (
        <button
          key={mode.value}
          className={`${styles.button} ${settings.layoutMode === mode.value ? styles.active : ''}`}
          onClick={() => updateSetting('layoutMode', mode.value)}
          aria-label={mode.label}
          aria-pressed={settings.layoutMode === mode.value}
          title={mode.title}
        >
          <span aria-hidden="true">{mode.icon}</span>
        </button>
      ))}
    </div>
  );
}
