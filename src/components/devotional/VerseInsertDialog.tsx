import { useState } from 'react';
import { parseStandardRef, refSegmentsToVerseRefs, type RefSegment } from '@/lib/standard-ref-parser';
import styles from './VerseInsertDialog.module.scss';

interface VerseInsertDialogProps {
  onInsert: (text: string) => void;
  onClose: () => void;
}

interface VerseResult {
  verse: { verse: number; text: string; chapter: number };
  bookShortName: string;
}

export function VerseInsertDialog({ onInsert, onClose }: VerseInsertDialogProps) {
  const [query, setQuery] = useState('');
  const [segments, setSegments] = useState<RefSegment[]>([]);
  const [verses, setVerses] = useState<VerseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'reference' | 'quote'>('reference');

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setSegments([]);
    setVerses([]);
    setError(null);

    try {
      const parsed = parseStandardRef(query.trim());
      if (parsed.length === 0) {
        setError('Ugyldig referanse. Prøv f.eks. "Joh 3,16" eller "Sal 23,1-6"');
        setLoading(false);
        return;
      }

      setSegments(parsed);

      // Fetch verses for preview
      const refs = refSegmentsToVerseRefs(parsed);
      const response = await fetch('/api/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs }),
      });
      const data = await response.json() as VerseResult[];
      setVerses(data || []);
    } catch {
      setError('Kunne ikke hente vers');
    }
    setLoading(false);
  }

  function handleInsert() {
    if (segments.length === 0) return;

    const refStr = query.trim();

    if (mode === 'reference') {
      onInsert(`[ref:${refStr}]`);
    } else {
      if (verses.length > 0) {
        const verseTexts = verses.map(v => `> *${v.verse.text}*`).join('\n');
        const displayRef = refStr;
        onInsert(`${verseTexts}\n> — ${displayRef}\n`);
      } else {
        onInsert(`[ref:${refStr}]`);
      }
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Sett inn versreferanse</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Skriv referanse (f.eks. Joh 3,16 eller Sal 23,1-6)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              autoFocus
            />
            <button
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={!query.trim() || loading}
            >
              {loading ? '...' : 'Finn'}
            </button>
          </div>

          {error && (
            <p className={styles.error}>{error}</p>
          )}

          {segments.length > 0 && (
            <div className={styles.result}>
              <div className={styles.refDisplay}>{query.trim()}</div>
              {verses.length > 0 && (
                <div className={styles.versePreview}>
                  {verses.map((v, i) => (
                    <p key={i} className={styles.verseLine}>
                      <sup className={styles.verseNum}>{v.verse.verse}</sup>
                      {v.verse.text}
                    </p>
                  ))}
                </div>
              )}

              <div className={styles.modeSelector}>
                <label className={styles.modeLabel}>
                  <input
                    type="radio"
                    name="insertMode"
                    checked={mode === 'reference'}
                    onChange={() => setMode('reference')}
                  />
                  Sett inn referanse
                </label>
                <label className={styles.modeLabel}>
                  <input
                    type="radio"
                    name="insertMode"
                    checked={mode === 'quote'}
                    onChange={() => setMode('quote')}
                  />
                  Sett inn sitat
                </label>
              </div>

              <div className={styles.preview}>
                <span className={styles.previewLabel}>Forhåndsvisning:</span>
                <code className={styles.previewCode}>
                  {mode === 'reference'
                    ? `[ref:${query.trim()}]`
                    : `> ${verses[0]?.verse.text?.substring(0, 50) || ''}...`
                  }
                </code>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Avbryt</button>
          <button
            className={styles.insertButton}
            onClick={handleInsert}
            disabled={segments.length === 0}
          >
            Sett inn
          </button>
        </div>
      </div>
    </div>
  );
}
