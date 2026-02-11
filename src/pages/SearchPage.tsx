import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ReferenceInput } from '@/components/ReferenceInput';
import { useSettings } from '@/components/SettingsContext';
import { toUrlSlug } from '@/lib/url-utils';
import { searchUserBible } from '@/lib/offline/userBibles';
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

interface StoryResult {
  slug: string;
  title: string;
  description: string | null;
  category: string;
}

interface ThemeResult {
  id: number;
  name: string;
}

const RESULTS_PER_PAGE = 50;
const MAX_EXTRA_RESULTS = 5;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const initialQuery = searchParams.get('q') || '';
  const bible = settings.bible || 'osnb2';
  const bibleQuery = bible !== 'osnb2' ? `?bible=${bible}` : '';

  const [query, setQuery] = useState(initialQuery);

  // Sync query state when URL params change (e.g. header search)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [stories, setStories] = useState<StoryResult[]>([]);
  const [themes, setThemes] = useState<ThemeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, offset = 0, append = false) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setStories([]);
      setThemes([]);
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
      const versePromise = bible.startsWith('user:')
        ? searchUserBible(bible, searchQuery, RESULTS_PER_PAGE, offset)
        : fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${RESULTS_PER_PAGE}&offset=${offset}&bible=${bible}`).then(r => r.json());

      // Only fetch stories/themes on first page
      const extraPromise = !append
        ? fetch(`/api/search/all?q=${encodeURIComponent(searchQuery)}`).then(r => r.json())
        : Promise.resolve(null);

      const [data, extraData] = await Promise.all([versePromise, extraPromise]);

      if (append) {
        setResults(prev => [...prev, ...(data.results || [])]);
      } else {
        setResults(data.results || []);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);

      if (extraData) {
        setStories(extraData.stories || []);
        setThemes(extraData.themes || []);
      }

      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) {
        setResults([]);
        setStories([]);
        setThemes([]);
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

    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  }

  const hasExtraResults = stories.length > 0 || themes.length > 0;

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
        </div>

        {searched && !loading && hasExtraResults && (
          <div className={styles.extraResults}>
            {stories.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Bibelhistorier</h2>
                <div className={styles.extraCards}>
                  {stories.slice(0, MAX_EXTRA_RESULTS).map((story) => (
                    <Link
                      key={story.slug}
                      to={`/historier/${story.slug}`}
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>{story.title}</span>
                      {story.description && (
                        <span className={styles.extraCardDesc}>
                          {story.description.length > 100
                            ? story.description.slice(0, 100) + '...'
                            : story.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                {stories.length > MAX_EXTRA_RESULTS && (
                  <Link to={`/historier`} className={styles.showAllLink}>
                    Vis alle {stories.length} historier
                  </Link>
                )}
              </div>
            )}

            {themes.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Temaer</h2>
                <div className={styles.extraCards}>
                  {themes.slice(0, MAX_EXTRA_RESULTS).map((theme) => (
                    <Link
                      key={theme.id}
                      to={`/temaer/${encodeURIComponent(theme.name)}`}
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>{theme.name}</span>
                    </Link>
                  ))}
                </div>
                {themes.length > MAX_EXTRA_RESULTS && (
                  <Link to={`/temaer`} className={styles.showAllLink}>
                    Vis alle {themes.length} temaer
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {searched && !loading && (
          <p className={styles.resultCount}>
            {total === 0
              ? (hasExtraResults ? '' : 'Ingen resultater funnet')
              : `Viser ${results.length} av ${total} bibeltekst-resultater`}
          </p>
        )}

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
