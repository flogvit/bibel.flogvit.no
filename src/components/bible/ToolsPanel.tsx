import { useState, useEffect } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import type { FontSize, BibleVersion } from '@/lib/settings';
import { bibleVersions } from '@/lib/settings';
import { getUserBibles } from '@/lib/offline/userBibles';
import { useDataImportExport } from '@/hooks/useDataImportExport';
import styles from './ToolsPanel.module.scss';

interface ToolsPanelProps {
  onClose?: () => void;
  hasParallels?: boolean;
}

export function ToolsPanel({ onClose, hasParallels = false }: ToolsPanelProps) {
  const { settings, toggleSetting, updateSetting } = useSettings();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const {
    fileInputRef,
    importData,
    importError,
    importSuccess,
    handleExport,
    handleFileSelect,
    handleImport,
    cancelImport,
    triggerFileSelect,
    getImportSummary,
  } = useDataImportExport();

  const [allVersions, setAllVersions] = useState(bibleVersions);

  useEffect(() => {
    getUserBibles().then(userBibles => {
      if (userBibles.length > 0) {
        setAllVersions([
          ...bibleVersions,
          ...userBibles.map(ub => ({ value: ub.id, label: ub.name })),
        ]);
      }
    });
  }, []);

  const currentBible = (searchParams.get('bible') as BibleVersion) || settings.bible || 'osnb2';
  const hidden = settings.hiddenBibles || [];

  // Filter hidden bibles (always keep active bible visible)
  const visibleVersions = allVersions.filter(
    v => !hidden.includes(v.value) || v.value === currentBible
  );

  function handleBibleChange(bible: BibleVersion) {
    // Swap: if switching to the same as secondary, set secondary to what primary was
    if (settings.secondaryBible && bible === settings.secondaryBible) {
      updateSetting('secondaryBible', currentBible);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('bible', bible);
    updateSetting('bible', bible);
    const queryString = params.toString();
    // Preserve the current hash (e.g., #v5) when changing bible
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    navigate(`${pathname}?${queryString}${hash}`);
  }

  const tools = [
    { key: 'showContextInline' as const, label: 'Vis kontekst i toppen' },
    { key: 'showChapterInsights' as const, label: 'Kapittelinnsikt' },
    { key: 'showVerseDetails' as const, label: 'Versdetaljer' },
    { key: 'showVerseIndicators' as const, label: 'Versindikatorer' },
    ...(hasParallels ? [{ key: 'showParallels' as const, label: 'Parallelle tekster' }] : []),
  ];

  // Build secondary bible options (exclude current primary bible, filter hidden)
  const secondaryOptions = [
    { value: 'original', label: 'Grunntekst' },
    ...visibleVersions.filter(v => v.value !== currentBible),
  ];

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Liten' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Stor' },
  ];

  return (
    <div className={styles.panel} role="region" aria-label="Hjelpemidler">
      <div className={styles.header}>
        <span className={styles.title}>Hjelpemidler</span>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Lukk hjelpemidler">
            ✕
          </button>
        )}
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Oversettelse</span>
        <div className={styles.bibleVersions}>
          {visibleVersions.map(version => (
            <button
              key={version.value}
              className={`${styles.bibleVersionButton} ${currentBible === version.value ? styles.active : ''}${version.value.startsWith('user:') ? ` ${styles.userBible}` : ''}`}
              onClick={() => handleBibleChange(version.value)}
            >
              {version.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Vis/skjul</span>
        <div className={styles.tools}>
          {tools.map(tool => (
            <label key={tool.key} className={styles.tool}>
              <input
                type="checkbox"
                checked={settings[tool.key] ?? false}
                onChange={() => toggleSetting(tool.key)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.label}>{tool.label}</span>
            </label>
          ))}

          <div className={styles.secondaryBibleRow}>
            <label className={styles.tool}>
              <input
                type="checkbox"
                checked={settings.showOriginalText ?? false}
                onChange={() => toggleSetting('showOriginalText')}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.label}>Undertekst</span>
            </label>
            <div className={styles.secondaryBibleSelectWrapper}>
              <select
                className={styles.secondaryBibleSelect}
                value={settings.secondaryBible || 'original'}
                onChange={(e) => updateSetting('secondaryBible', e.target.value)}
              >
                {secondaryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Skriftstørrelse</span>
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
        <span className={styles.sectionTitle}>Utseende</span>
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

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Data</span>
        <div className={styles.dataActions}>
          <button className={styles.dataButton} onClick={handleExport}>
            Eksporter data
          </button>
          <button
            className={styles.dataButton}
            onClick={triggerFileSelect}
          >
            Importer data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {importError && (
          <div className={styles.importError} role="alert">{importError}</div>
        )}

        {importSuccess && (
          <div className={styles.importSuccess} role="status" aria-live="polite">
            Data importert! Laster siden på nytt...
          </div>
        )}

        {importData && (
          <div className={styles.importPreview}>
            <p className={styles.importPreviewTitle}>Følgende data vil bli importert:</p>
            <ul className={styles.importList}>
              {getImportSummary(importData).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className={styles.importDate}>
              Eksportert: {new Date(importData.exportedAt).toLocaleDateString('nb-NO')}
            </p>
            <div className={styles.importButtons}>
              <button
                className={`${styles.importButton} ${styles.primary}`}
                onClick={() => handleImport(false)}
              >
                Erstatt alt
              </button>
              <button
                className={styles.importButton}
                onClick={() => handleImport(true)}
              >
                Slå sammen
              </button>
              <button
                className={`${styles.importButton} ${styles.cancel}`}
                onClick={cancelImport}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <Link to="/innstillinger" className={styles.settingsLink}>
          Alle innstillinger →
        </Link>
      </div>
    </div>
  );
}
