import { useState, useRef, useCallback } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { parseStandardRef, refSegmentsToVerseRefs } from '@/lib/standard-ref-parser';
import styles from './LookupPanel.module.scss';

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

interface SearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface Word4WordItem {
  word_index: number;
  word: string;
  original: string | null;
  pronunciation: string | null;
  explanation: string | null;
}

export function LookupPanel() {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [refResults, setRefResults] = useState<VerseWithOriginal[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'none' | 'ref' | 'search'>('none');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [word4word, setWord4word] = useState<Record<string, Word4WordItem[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const bible = settings.bible?.startsWith('user:') ? 'osnb2' : (settings.bible || 'osnb2');

  const doLookup = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setIsLoading(true);

    const segs = parseStandardRef(trimmed);
    if (segs.length > 0) {
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
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&bible=${encodeURIComponent(bible)}&limit=20`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setRefResults([]);
        setMode('search');
      } catch {
        setSearchResults([]);
        setMode('none');
      }
    }
    setIsLoading(false);
  }, [bible]);

  const handleExpand = async (key: string, bookId: number, chapter: number, verse: number) => {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);

    if (!word4word[key]) {
      try {
        const res = await fetch(`/api/word4word?bookId=${bookId}&chapter=${chapter}&verse=${verse}`);
        const data = await res.json();
        if (data.words) {
          setWord4word(prev => ({ ...prev, [key]: data.words }));
        }
      } catch {
        // Word4word not available for all verses
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      doLookup(query);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.searchForm}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Joh 3,16 eller søketekst..."
          className={styles.searchInput}
        />
        <button
          className={styles.searchButton}
          onClick={() => doLookup(query)}
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Søk'}
        </button>
      </div>

      <div className={styles.results}>
        {mode === 'ref' && refResults.map(item => {
          const key = `${item.verse.book_id}-${item.verse.chapter}-${item.verse.verse}`;
          const isExpanded = expandedKey === key;
          const w4w = word4word[key];

          return (
            <div
              key={key}
              className={`${styles.verse} ${isExpanded ? styles.expanded : ''}`}
              onClick={() => handleExpand(key, item.verse.book_id, item.verse.chapter, item.verse.verse)}
            >
              <div className={styles.verseHeader}>
                <span className={styles.verseRef}>
                  {item.bookShortName} {item.verse.chapter}:{item.verse.verse}
                </span>
              </div>
              <div className={styles.verseText}>{item.verse.text}</div>
              {isExpanded && item.originalText && (
                <div className={styles.originalText}>{item.originalText}</div>
              )}
              {isExpanded && w4w && (
                <div className={styles.word4word}>
                  {w4w.map((w, j) => (
                    <div key={j} className={styles.wordItem}>
                      <span className={styles.original}>{w.original}</span>
                      <span className={styles.transliteration}>{w.pronunciation}</span>
                      <span className={styles.translation}>{w.word}</span>
                      {w.explanation && <span className={styles.explanation}>{w.explanation}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {mode === 'search' && searchResults.map((result, i) => {
          const key = `search-${result.book_id}-${result.chapter}-${result.verse}-${i}`;
          const isExpanded = expandedKey === key;
          const w4w = word4word[key];

          return (
            <div
              key={key}
              className={`${styles.verse} ${isExpanded ? styles.expanded : ''}`}
              onClick={() => handleExpand(key, result.book_id, result.chapter, result.verse)}
            >
              <div className={styles.verseHeader}>
                <span className={styles.verseRef}>
                  {result.book_short_name} {result.chapter}:{result.verse}
                </span>
              </div>
              <div className={styles.verseText}>{result.text}</div>
              {isExpanded && w4w && (
                <div className={styles.word4word}>
                  {w4w.map((w, j) => (
                    <div key={j} className={styles.wordItem}>
                      <span className={styles.original}>{w.original}</span>
                      <span className={styles.transliteration}>{w.pronunciation}</span>
                      <span className={styles.translation}>{w.word}</span>
                      {w.explanation && <span className={styles.explanation}>{w.explanation}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {mode !== 'none' && refResults.length === 0 && searchResults.length === 0 && !isLoading && (
          <div className={styles.empty}>Ingen resultater funnet.</div>
        )}
      </div>
    </div>
  );
}
