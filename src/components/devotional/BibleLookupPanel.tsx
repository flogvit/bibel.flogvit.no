import { useState, useRef, useCallback } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { parseStandardRef, refSegmentsToVerseRefs } from '@/lib/standard-ref-parser';
import { getBookShortNameById } from '@/lib/books-data';
import type { RefSegment } from '@/lib/standard-ref-parser';
import styles from './BibleLookupPanel.module.scss';

interface VerseData {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  bible: string;
}

interface VerseWithOriginal {
  verse: VerseData;
  originalText: string | null;
  originalLanguage: 'hebrew' | 'greek';
  bookShortName: string;
}

interface Word4WordData {
  word_index: number;
  word: string;
  original: string | null;
  pronunciation: string | null;
  explanation: string | null;
}

interface SearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleLookupPanelProps {
  onInsert: (text: string) => void;
}

function LookupVerseItem({
  item,
  onInsertRef,
  onInsertQuote,
}: {
  item: VerseWithOriginal;
  onInsertRef: () => void;
  onInsertQuote: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [word4word, setWord4word] = useState<Word4WordData[] | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word4WordData | null>(null);
  const [loading, setLoading] = useState(false);

  const { verse, originalText, originalLanguage } = item;
  const isHebrew = originalLanguage === 'hebrew';

  async function loadWord4Word() {
    if (word4word !== null) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/word4word?bookId=${verse.book_id}&chapter=${verse.chapter}&verse=${verse.verse}&bible=original&lang=nb`
      );
      const data = await res.json();
      setWord4word(Array.isArray(data) ? data : []);
    } catch {
      setWord4word([]);
    }
    setLoading(false);
  }

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) loadWord4Word();
    if (!next) setSelectedWord(null);
  }

  return (
    <div className={styles.lookupVerse}>
      <div className={styles.lookupVerseMain}>
        <span
          className={styles.verseNum}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          title="Vis grunntekst"
        >
          {verse.verse}
        </span>
        <span className={styles.verseText}>{verse.text}</span>
      </div>

      {originalText && !expanded && (
        <div
          className={`${styles.originalInline} ${isHebrew ? styles.hebrew : styles.greek}`}
          dir={isHebrew ? 'rtl' : 'ltr'}
          lang={isHebrew ? 'he' : 'el'}
        >
          {originalText}
        </div>
      )}

      {expanded && (
        <div className={styles.lookupExpanded}>
          {originalText && (
            <div
              className={`${styles.originalFull} ${isHebrew ? styles.hebrew : styles.greek}`}
              dir={isHebrew ? 'rtl' : 'ltr'}
              lang={isHebrew ? 'he' : 'el'}
            >
              {originalText}
            </div>
          )}

          {loading && <p className={styles.loadingText}>Laster ord-for-ord...</p>}

          {word4word && word4word.length > 0 && (
            <div className={styles.word4wordSection}>
              <div
                className={`${styles.word4wordList} ${isHebrew ? styles.hebrewWords : ''}`}
                dir={isHebrew ? 'rtl' : 'ltr'}
                lang={isHebrew ? 'he' : 'el'}
              >
                {word4word.map(w => (
                  <span
                    key={w.word_index}
                    className={`${styles.w4wWord} ${selectedWord?.word_index === w.word_index ? styles.w4wSelected : ''}`}
                    onClick={() => setSelectedWord(selectedWord?.word_index === w.word_index ? null : w)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={styles.w4wOriginal}>{w.word}</span>
                    {w.pronunciation && (
                      <span className={styles.w4wPronunciation}>{w.pronunciation}</span>
                    )}
                  </span>
                ))}
              </div>

              {selectedWord && (
                <div className={styles.w4wDetail}>
                  <strong>{selectedWord.word}</strong>
                  {selectedWord.pronunciation && (
                    <span className={styles.w4wDetailPronunciation}> ({selectedWord.pronunciation})</span>
                  )}
                  {selectedWord.explanation && (
                    <p className={styles.w4wExplanation}>{selectedWord.explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={styles.verseInsertActions}>
            <button className={styles.miniBtn} onClick={onInsertRef}>Ref</button>
            <button className={styles.miniBtn} onClick={onInsertQuote}>Sitat</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BibleLookupPanel({ onInsert }: BibleLookupPanelProps) {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [refResults, setRefResults] = useState<VerseWithOriginal[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [segments, setSegments] = useState<RefSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'none' | 'ref' | 'search'>('none');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const bible = settings.bible?.startsWith('user:') ? 'osnb2' : (settings.bible || 'osnb2');

  const addToHistory = useCallback((q: string) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h !== q);
      return [q, ...filtered].slice(0, 5);
    });
  }, []);

  const doLookup = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setIsLoading(true);
    addToHistory(trimmed);

    // Try reference parse first
    const segs = parseStandardRef(trimmed);
    if (segs.length > 0) {
      setSegments(segs);
      const refs = refSegmentsToVerseRefs(segs);
      try {
        const res = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs, bible }),
        });
        const data = await res.json();
        setRefResults(Array.isArray(data) ? data : []);
        setSearchResults([]);
        setMode('ref');
      } catch {
        setRefResults([]);
        setMode('none');
      }
    } else {
      // Full-text search
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&bible=${encodeURIComponent(bible)}&limit=20`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setRefResults([]);
        setSegments([]);
        setMode('search');
      } catch {
        setSearchResults([]);
        setMode('none');
      }
    }
    setIsLoading(false);
  }, [addToHistory, bible]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      doLookup(query);
    }
  }

  function formatRefLabel(segs: RefSegment[]): string {
    if (segs.length === 0) return '';
    const first = segs[0];
    const last = segs[segs.length - 1];
    let label = `${first.bookShortName} ${first.chapter}`;
    if (first.verses?.length) {
      label += `,${first.verses[0]}`;
      if (first.verses.length > 1) {
        label += `-${first.verses[first.verses.length - 1]}`;
      }
    }
    if (segs.length > 1 && last !== first) {
      if (last.chapter !== first.chapter) {
        label += `-${last.chapter}`;
        if (last.verses?.length) {
          label += `,${last.verses[last.verses.length - 1]}`;
        }
      }
    }
    return label;
  }

  function handleInsertAllRef() {
    const label = formatRefLabel(segments);
    if (label) onInsert(`[ref:${label}]`);
  }

  function handleInsertAllQuote() {
    if (refResults.length === 0) return;
    const label = formatRefLabel(segments);
    const lines = refResults.map(r => `> **${r.verse.verse}** ${r.verse.text}`);
    onInsert(`${lines.join('\n')}\n> — ${label}\n`);
  }

  function handleInsertSingleRef(item: VerseWithOriginal) {
    const short = item.bookShortName || getBookShortNameById(item.verse.book_id) || '';
    onInsert(`[ref:${short} ${item.verse.chapter},${item.verse.verse}]`);
  }

  function handleInsertSingleQuote(item: VerseWithOriginal) {
    const short = item.bookShortName || getBookShortNameById(item.verse.book_id) || '';
    onInsert(`> **${item.verse.verse}** ${item.verse.text}\n> — ${short} ${item.verse.chapter},${item.verse.verse}\n`);
  }

  function handleInsertSearchRef(r: SearchResult) {
    const short = r.book_short_name || getBookShortNameById(r.book_id) || '';
    onInsert(`[ref:${short} ${r.chapter},${r.verse}]`);
  }

  function handleInsertSearchQuote(r: SearchResult) {
    const short = r.book_short_name || getBookShortNameById(r.book_id) || '';
    onInsert(`> **${r.verse}** ${r.text}\n> — ${short} ${r.chapter},${r.verse}\n`);
  }

  function highlightQuery(text: string, q: string): React.ReactNode {
    if (!q.trim()) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className={styles.highlight}>{part}</mark> : part
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Joh 3,16 eller søkeord..."
        />
        <button
          className={styles.searchButton}
          onClick={() => doLookup(query)}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? '...' : 'Slå opp'}
        </button>
      </div>

      {history.length > 0 && (
        <div className={styles.history}>
          {history.map(h => (
            <button
              key={h}
              className={styles.historyChip}
              onClick={() => { setQuery(h); doLookup(h); }}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {mode === 'ref' && refResults.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>{formatRefLabel(segments)}</span>
            <div className={styles.insertButtons}>
              <button className={styles.insertRefBtn} onClick={handleInsertAllRef}>
                Sett inn referanse
              </button>
              <button className={styles.insertQuoteBtn} onClick={handleInsertAllQuote}>
                Sett inn sitat
              </button>
            </div>
          </div>
          <div className={styles.verseList}>
            {refResults.map(item => (
              <LookupVerseItem
                key={`${item.verse.book_id}-${item.verse.chapter}-${item.verse.verse}`}
                item={item}
                onInsertRef={() => handleInsertSingleRef(item)}
                onInsertQuote={() => handleInsertSingleQuote(item)}
              />
            ))}
          </div>
        </div>
      )}

      {mode === 'search' && searchResults.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>{searchResults.length} treff</span>
          </div>
          <div className={styles.searchList}>
            {searchResults.map((r, i) => (
              <div key={i} className={styles.searchItem}>
                <div className={styles.searchItemHeader}>
                  <span className={styles.searchRef}>
                    {r.book_name_no} {r.chapter},{r.verse}
                  </span>
                  <div className={styles.searchItemActions}>
                    <button
                      className={styles.miniBtn}
                      onClick={() => handleInsertSearchRef(r)}
                      title="Sett inn referanse"
                    >
                      Ref
                    </button>
                    <button
                      className={styles.miniBtn}
                      onClick={() => handleInsertSearchQuote(r)}
                      title="Sett inn sitat"
                    >
                      Sitat
                    </button>
                  </div>
                </div>
                <div className={styles.searchItemText}>
                  {highlightQuery(r.text, query)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'search' && searchResults.length === 0 && !isLoading && (
        <p className={styles.noResults}>Ingen treff</p>
      )}

      {mode === 'ref' && refResults.length === 0 && !isLoading && (
        <p className={styles.noResults}>Fant ingen vers</p>
      )}
    </div>
  );
}
