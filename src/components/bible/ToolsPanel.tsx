'use client';

import { useSettings } from '@/components/SettingsContext';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { FontSize, BibleVersion } from '@/lib/settings';
import { bibleVersions } from '@/lib/settings';
import styles from './ToolsPanel.module.scss';

interface ToolsPanelProps {
  onClose?: () => void;
}

export function ToolsPanel({ onClose }: ToolsPanelProps) {
  const { settings, toggleSetting, updateSetting } = useSettings();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentBible = (searchParams.get('bible') as BibleVersion) || settings.bible || 'osnb1';

  function handleBibleChange(bible: BibleVersion) {
    const params = new URLSearchParams(searchParams.toString());
    if (bible === 'osnb1') {
      params.delete('bible');
    } else {
      params.set('bible', bible);
    }
    updateSetting('bible', bible);
    const queryString = params.toString();
    // Preserve the current hash (e.g., #v5) when changing bible
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const newUrl = queryString ? `${pathname}?${queryString}${hash}` : `${pathname}${hash}`;
    router.push(newUrl);
  }

  const tools = [
    { key: 'showBookSummary' as const, label: 'Boksammendrag' },
    { key: 'showChapterSummary' as const, label: 'Kapittelsammendrag' },
    { key: 'showImportantWords' as const, label: 'Viktige ord' },
    { key: 'showWord4Word' as const, label: 'Ordforklaring' },
    { key: 'showReferences' as const, label: 'Referanser' },
    { key: 'showOriginalText' as const, label: 'Grunntekst' },
  ];

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Liten' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Stor' },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Hjelpemidler</h4>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className={styles.section}>
        <h5>Oversettelse</h5>
        <div className={styles.bibleVersions}>
          {bibleVersions.map(version => (
            <button
              key={version.value}
              className={`${styles.bibleVersionButton} ${currentBible === version.value ? styles.active : ''}`}
              onClick={() => handleBibleChange(version.value)}
            >
              {version.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h5>Vis/skjul</h5>
        <div className={styles.tools}>
          {tools.map(tool => (
            <label key={tool.key} className={styles.tool}>
              <input
                type="checkbox"
                checked={settings[tool.key]}
                onChange={() => toggleSetting(tool.key)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.label}>{tool.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h5>Skriftstørrelse</h5>
        <div className={styles.fontSizes}>
          {fontSizes.map(size => (
            <button
              key={size.value}
              className={`${styles.fontSizeButton} ${settings.fontSize === size.value ? styles.active : ''}`}
              onClick={() => updateSetting('fontSize', size.value)}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h5>Utseende</h5>
        <label className={styles.tool}>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => toggleSetting('darkMode')}
          />
          <span className={styles.checkmark}></span>
          <span className={styles.label}>Mørk modus</span>
        </label>
      </div>
    </div>
  );
}
