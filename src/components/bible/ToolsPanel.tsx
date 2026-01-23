'use client';

import { useState, useRef } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { FontSize, BibleVersion } from '@/lib/settings';
import { bibleVersions } from '@/lib/settings';
import {
  downloadUserData,
  importUserData,
  validateUserDataExport,
  getImportSummary,
  type UserDataExport,
} from '@/lib/user-data';
import styles from './ToolsPanel.module.scss';

interface ToolsPanelProps {
  onClose?: () => void;
}

export function ToolsPanel({ onClose }: ToolsPanelProps) {
  const { settings, toggleSetting, updateSetting } = useSettings();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importData, setImportData] = useState<UserDataExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

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

  function handleExport() {
    downloadUserData();
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!validateUserDataExport(data)) {
          setImportError('Ugyldig filformat. Velg en gyldig eksportfil.');
          setImportData(null);
          return;
        }

        setImportData(data);
      } catch {
        setImportError('Kunne ikke lese filen. Sjekk at det er en gyldig JSON-fil.');
        setImportData(null);
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  }

  function handleImport(merge: boolean) {
    if (!importData) return;

    try {
      importUserData(importData, merge);
      setImportSuccess(true);
      setImportData(null);
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Kunne ikke importere data.');
    }
  }

  function cancelImport() {
    setImportData(null);
    setImportError(null);
  }

  const tools = [
    { key: 'showBookSummary' as const, label: 'Boksammendrag' },
    { key: 'showChapterSummary' as const, label: 'Kapittelsammendrag' },
    { key: 'showChapterContext' as const, label: 'Historisk kontekst' },
    { key: 'showChapterInsights' as const, label: 'Kapittelinnsikt' },
    { key: 'showImportantWords' as const, label: 'Viktige ord' },
    { key: 'showWord4Word' as const, label: 'Ordforklaring' },
    { key: 'showVerseDetails' as const, label: 'Versdetaljer' },
    { key: 'showOriginalText' as const, label: 'Grunntekst' },
    { key: 'showTimeline' as const, label: 'Tidslinje' },
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
            onClick={() => fileInputRef.current?.click()}
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
    </div>
  );
}
