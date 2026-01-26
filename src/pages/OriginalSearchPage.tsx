import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toUrlSlug } from '@/lib/url-utils';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import styles from '@/styles/pages/original-search.module.scss';

interface SearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
  original_text: string;
  norwegianWords: string[];
  originalWordsInVerse: string[];
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  word: string;
  language: 'hebrew' | 'greek';
  matchingWords: string[];
}

const RESULTS_PER_PAGE = 50;

// Normalize Hebrew by removing cantillation marks for comparison
function normalizeHebrew(text: string): string {
  return text.replace(/[\u0591-\u05AF]/g, '');
}

// Strip all Hebrew diacritics (cantillation + vowels) for looser matching
function stripHebrewDiacritics(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, '');
}

export function OriginalSearchPage() {
  const [searchParams] = useSearchParams();
  const word = searchParams.get('word') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [language, setLanguage] = useState<'hebrew' | 'greek'>('greek');
  const [matchingWords, setMatchingWords] = useState<string[]>([]);

  const performSearch = useCallback(async (searchWord: string, offset = 0, append = false) => {
    if (!searchWord) {
      setResults([]);
      setSearched(false);
      setTotal(0);
      setHasMore(false);
      setMatchingWords([]);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/search/original-word?word=${encodeURIComponent(searchWord)}&limit=${RESULTS_PER_PAGE}&offset=${offset}`);
      const data: SearchResponse = await res.json();
      if (append) {
        setResults(prev => [...prev, ...(data.results || [])]);
      } else {
        setResults(data.results || []);
        setMatchingWords(data.matchingWords || []);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setLanguage(data.language || 'greek');
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setMatchingWords([]);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Highlight matching words in original text using the specific words found in each verse
  function highlightOriginalText(text: string, wordsToHighlight: string[], isHebrew: boolean): React.ReactNode {
    if (!wordsToHighlight || wordsToHighlight.length === 0) return text;

    // Normalize the words to highlight for comparison
    const normalizedWordsToHighlight = wordsToHighlight.map(w =>
      isHebrew ? normalizeHebrew(w) : w
    );
    const strippedWordsToHighlight = wordsToHighlight.map(w =>
      isHebrew ? stripHebrewDiacritics(w) : w
    );

    // Split text by spaces while preserving the spaces
    const parts = text.split(/(\s+)/);

    return parts.map((part, index) => {
      // Normalize the part for comparison
      const normalizedPart = isHebrew ? normalizeHebrew(part) : part;
      const strippedPart = isHebrew ? stripHebrewDiacritics(part) : part;

      // Check if this part matches any of the words to highlight
      const isMatch = normalizedWordsToHighlight.some((nw, i) => {
        // Exact match after normalization
        if (normalizedPart === nw) return true;
        // Check if stripped versions match (handles prefix variations)
        if (strippedPart === strippedWordsToHighlight[i]) return true;
        // Check if part ends with the stripped word (for prefixes)
        if (isHebrew && strippedPart.endsWith(strippedWordsToHighlight[i])) return true;
        return false;
      });

      if (isMatch) {
        return <mark key={index} className={styles.highlight}>{part}</mark>;
      }
      return part;
    });
  }

  // Highlight Norwegian words that correspond to the original word
  function highlightNorwegianText(text: string, norwegianWords: string[]): React.ReactNode {
    if (!norwegianWords || norwegianWords.length === 0) return text;

    // Normalize Norwegian words for comparison (lowercase)
    const normalizedWords = norwegianWords.map(w => w.toLowerCase());

    // Split text by word boundaries while preserving punctuation and spaces
    const parts = text.split(/(\s+|[,.:;!?])/);

    return parts.map((part, index) => {
      // Check if this word matches any of the Norwegian words (exact match, case-insensitive)
      const isMatch = normalizedWords.includes(part.toLowerCase());

      if (isMatch) {
        return <mark key={index} className={styles.highlight}>{part}</mark>;
      }
      return part;
    });
  }

  useEffect(() => {
    if (word) {
      performSearch(word);
    }
  }, [word, performSearch]);

  const languageLabel = language === 'hebrew' ? 'hebraisk' : 'gresk';

  return (
    <div className={styles.main}>
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Søk', href: '/sok' },
          { label: 'Originalspråk' }
        ]} />
        <h1>Forekomster av {languageLabel} ord</h1>

        {word && (
          <div className={styles.searchWord}>
            <span className={language === 'hebrew' ? styles.hebrew : styles.greek} dir={language === 'hebrew' ? 'rtl' : 'ltr'} lang={language === 'hebrew' ? 'he' : 'el'}>
              {word}
            </span>
          </div>
        )}

        {loading && <p className="text-muted">Laster...</p>}

        {searched && !loading && (
          <p className={styles.resultCount}>
            {total === 0
              ? 'Ingen resultater funnet'
              : `Fant ${total} forekomster`}
          </p>
        )}

        {results.length > 0 && (
          <>
            <div className={styles.results}>
              {results.map((result) => (
                <Link
                  key={`${result.book_id}-${result.chapter}-${result.verse}`}
                  to={`/${toUrlSlug(result.book_short_name)}/${result.chapter}#v${result.verse}`}
                  className={styles.result}
                >
                  <span className={styles.reference}>
                    {result.book_name_no} {result.chapter}:{result.verse}
                  </span>
                  <p className={styles.text}>
                    {highlightNorwegianText(result.text, result.norwegianWords)}
                  </p>
                  <p
                    className={`${styles.originalText} ${language === 'hebrew' ? styles.hebrew : styles.greek}`}
                    dir={language === 'hebrew' ? 'rtl' : 'ltr'}
                    lang={language === 'hebrew' ? 'he' : 'el'}
                  >
                    {highlightOriginalText(result.original_text, result.originalWordsInVerse, language === 'hebrew')}
                  </p>
                </Link>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => performSearch(word, results.length, true)}
                className={styles.loadMoreButton}
                disabled={loadingMore}
              >
                {loadingMore ? 'Laster...' : 'Last flere resultater'}
              </button>
            )}
          </>
        )}

        <div className={styles.backLink}>
          <Link to="/sok">Tilbake til vanlig søk</Link>
        </div>
      </div>
    </div>
  );
}
