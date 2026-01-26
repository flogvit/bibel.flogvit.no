import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ReferenceInput } from '@/components/ReferenceInput';
import { useSettings } from '@/components/SettingsContext';
import { toUrlSlug } from '@/lib/url-utils';
import styles from '@/styles/pages/search.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface SearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
}

const RESULTS_PER_PAGE = 50;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const initialQuery = searchParams.get('q') || '';
  const bible = settings.bible || 'osnb2';
  const bibleQuery = bible !== 'osnb2' ? `?bible=${bible}` : '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, offset = 0, append = false) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setSearched(false);
      setTotal(0);
      setHasMore(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${RESULTS_PER_PAGE}&offset=${offset}&bible=${bible}`);
      const data = await res.json();
      if (append) {
        setResults(prev => [...prev, ...(data.results || [])]);
      } else {
        setResults(data.results || []);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  }, [bible]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  function handleTextSearch(searchQuery: string) {
    setQuery(searchQuery);
    navigate(`/sok?q=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  }

  function highlightMatch(text: string, searchQuery: string) {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className={styles.main}>
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Søk' }
        ]} />
        <h1>Søk i Bibelen</h1>

        <div className={styles.searchForm}>
          <ReferenceInput
            onTextSearch={handleTextSearch}
            autoFocus
            initialValue={initialQuery}
          />
        </div>

        <div role="status" aria-live="polite" aria-atomic="true">
          {loading && <p className="text-muted">Søker...</p>}
          {searched && !loading && (
            <p className={styles.resultCount}>
              {total === 0
                ? 'Ingen resultater funnet'
                : `Viser ${results.length} av ${total} resultater`}
            </p>
          )}
        </div>

        {results.length > 0 && (
          <>
            <div className={styles.results}>
              {results.map((result) => (
                <Link
                  key={`${result.book_id}-${result.chapter}-${result.verse}`}
                  to={`/${toUrlSlug(result.book_short_name)}/${result.chapter}${bibleQuery}#v${result.verse}`}
                  className={styles.result}
                >
                  <span className={styles.reference}>
                    {result.book_name_no} {result.chapter}:{result.verse}
                  </span>
                  <p className={styles.text}>
                    {highlightMatch(result.text, query)}
                  </p>
                </Link>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => performSearch(query, results.length, true)}
                className={styles.loadMoreButton}
                disabled={loadingMore}
                aria-busy={loadingMore}
              >
                {loadingMore ? 'Laster...' : 'Last flere resultater'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
