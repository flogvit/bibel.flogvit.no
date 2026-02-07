import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './KeyboardShortcuts.module.scss';
import { useSettings } from './SettingsContext';

interface KeyboardShortcutsProps {
  // For chapter navigation - only provided on chapter pages
  bookSlug?: string;
  currentChapter?: number;
  maxChapter?: number;
  nextBookSlug?: string;
  bibleQuery?: string;
}

export function KeyboardShortcuts({
  bookSlug,
  currentChapter,
  maxChapter,
  nextBookSlug,
  bibleQuery = '',
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { toggleSetting } = useSettings();

  // Detect Mac on client side
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when typing in input fields
      if (isInputFocused() && e.key !== 'Escape') {
        return;
      }

      // ? or Shift+/ to show help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Escape to close help
      if (e.key === 'Escape' && showHelp) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }

      // R to toggle reading mode
      if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          toggleSetting('readingMode');
          return;
        }
      }

      // Arrow key navigation for chapters (only on chapter pages)
      if (bookSlug && currentChapter && maxChapter) {
        if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (currentChapter > 1) {
            navigate(`/${bookSlug}/${currentChapter - 1}${bibleQuery}`);
          }
          return;
        }

        if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (currentChapter < maxChapter) {
            navigate(`/${bookSlug}/${currentChapter + 1}${bibleQuery}`);
          } else if (nextBookSlug) {
            navigate(`/${nextBookSlug}/1${bibleQuery}`);
          }
          return;
        }

        // Number keys 1-9 to jump to verse
        if (!e.metaKey && !e.ctrlKey && !e.altKey && /^[1-9]$/.test(e.key)) {
          const verseElement = document.getElementById(`v${e.key}`);
          if (verseElement) {
            e.preventDefault();
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            window.history.replaceState(null, '', `#v${e.key}`);
          }
          return;
        }
      }

      // Global shortcuts with Alt+Shift modifier
      // Use e.code instead of e.key to handle Mac Option+Shift producing special characters
      if (e.altKey && e.shiftKey) {
        switch (e.code) {
          case 'KeyH':
            e.preventDefault();
            navigate('/');
            break;
          case 'KeyS':
            e.preventDefault();
            navigate('/sok');
            break;
          case 'KeyL':
            e.preventDefault();
            navigate('/leseplan');
            break;
          case 'KeyT':
            e.preventDefault();
            navigate('/tidslinje');
            break;
          case 'KeyP':
            e.preventDefault();
            navigate('/profetier');
            break;
          case 'KeyF':
            e.preventDefault();
            navigate('/favoritter');
            break;
          case 'KeyE':
            e.preventDefault();
            navigate('/emner');
            break;
          case 'KeyN':
            e.preventDefault();
            navigate('/notater');
            break;
          case 'KeyK':
            e.preventDefault();
            navigate('/kjente-vers');
            break;
          case 'KeyO':
            e.preventDefault();
            navigate('/personer');
            break;
          case 'KeyV':
            e.preventDefault();
            navigate('/lister');
            break;
          case 'KeyA':
            e.preventDefault();
            navigate('/paralleller');
            break;
          case 'KeyI':
            e.preventDefault();
            navigate('/statistikk');
            break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isInputFocused, showHelp, bookSlug, currentChapter, maxChapter, nextBookSlug, bibleQuery, navigate, toggleSetting]);

  // Close help on navigation
  useEffect(() => {
    setShowHelp(false);
  }, [pathname]);

  if (!showHelp) return null;

  return (
    <div className={styles.overlay} onClick={() => setShowHelp(false)}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className={styles.header}>
          <h2 id="shortcuts-title">Hurtigtaster</h2>
          <button
            className={styles.closeButton}
            onClick={() => setShowHelp(false)}
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3>Generelt</h3>
            <dl className={styles.shortcuts}>
              <div className={styles.shortcut}>
                <dt><kbd>?</kbd></dt>
                <dd>Vis/skjul denne hjelpen</dd>
              </div>
              <div className={styles.shortcut}>
                <dt><kbd>/</kbd></dt>
                <dd>Gå til søkefeltet</dd>
              </div>
              <div className={styles.shortcut}>
                <dt><kbd>R</kbd></dt>
                <dd>Lesemodus på/av</dd>
              </div>
              <div className={styles.shortcut}>
                <dt><kbd>Esc</kbd></dt>
                <dd>Lukk dialoger</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section}>
            <h3>Kapittelnavigasjon</h3>
            <p className={styles.hint}>Fungerer kun på kapittelsider</p>
            <dl className={styles.shortcuts}>
              <div className={styles.shortcut}>
                <dt><kbd>←</kbd></dt>
                <dd>Forrige kapittel</dd>
              </div>
              <div className={styles.shortcut}>
                <dt><kbd>→</kbd></dt>
                <dd>Neste kapittel</dd>
              </div>
              <div className={styles.shortcut}>
                <dt><kbd>1</kbd>-<kbd>9</kbd></dt>
                <dd>Hopp til vers 1-9</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section}>
            <h3>Hurtignavigasjon</h3>
            <p className={styles.hint}>
              {isMac ? 'Bruk ⌥ Option + ⇧ Shift + bokstav' : 'Bruk Alt + Shift + bokstav'}
            </p>
            <dl className={styles.shortcuts}>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>H</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd></>}</dt>
                <dd>Hjem (bokliste)</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd></>}</dt>
                <dd>Søk</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>L</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd></>}</dt>
                <dd>Leseplan</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>T</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd></>}</dt>
                <dd>Tidslinje</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>P</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd></>}</dt>
                <dd>Profetier</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>F</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd></>}</dt>
                <dd>Favoritter</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>E</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd></>}</dt>
                <dd>Emner</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>N</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd></>}</dt>
                <dd>Notater</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>K</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd></>}</dt>
                <dd>Kjente vers</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>O</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd></>}</dt>
                <dd>Personer</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>V</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd></>}</dt>
                <dd>Verslister</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>A</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd></>}</dt>
                <dd>Paralleller</dd>
              </div>
              <div className={styles.shortcut}>
                <dt>{isMac ? <><kbd>⌥</kbd>+<kbd>⇧</kbd>+<kbd>I</kbd></> : <><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd></>}</dt>
                <dd>Statistikk</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
