import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ReferenceInput } from '@/components/ReferenceInput';
import { useSettings } from '@/components/SettingsContext';
import { defaultSearchResultTypes } from '@/lib/settings';
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

interface PersonResult {
  id: string;
  name: string;
  title: string;
  era: string;
  summary: string;
  roles: string[];
}

interface ProphecyResult {
  id: string;
  title: string;
  explanation: string | null;
  category_name: string;
  prophecy_ref: string;
}

interface TimelineResult {
  id: string;
  title: string;
  description: string | null;
  year_display: string | null;
  timeline_type: string;
}

interface GospelParallelResult {
  id: string;
  title: string;
  notes: string | null;
  section_name: string;
}

interface ReadingPlanResult {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  days: number;
}

interface ImportantWordResult {
  word: string;
  explanation: string;
  book_id: number;
  chapter: number;
  book_short_name: string;
  book_name_no: string;
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
  const searchTypes = { ...defaultSearchResultTypes, ...settings.searchResultTypes };

  const [query, setQuery] = useState(initialQuery);

  // Sync query state when URL params change (e.g. header search)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [stories, setStories] = useState<StoryResult[]>([]);
  const [themes, setThemes] = useState<ThemeResult[]>([]);
  const [persons, setPersons] = useState<PersonResult[]>([]);
  const [prophecies, setProphecies] = useState<ProphecyResult[]>([]);
  const [timeline, setTimeline] = useState<TimelineResult[]>([]);
  const [parallels, setParallels] = useState<GospelParallelResult[]>([]);
  const [plans, setPlans] = useState<ReadingPlanResult[]>([]);
  const [words, setWords] = useState<ImportantWordResult[]>([]);
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
      setPersons([]);
      setProphecies([]);
      setTimeline([]);
      setParallels([]);
      setPlans([]);
      setWords([]);
      setExpandedSections(new Set());
      setSearched(false);
      setTotal(0);
      setHasMore(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setExpandedSections(new Set());
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
        setPersons(extraData.persons || []);
        setProphecies(extraData.prophecies || []);
        setTimeline(extraData.timeline || []);
        setParallels(extraData.parallels || []);
        setPlans(extraData.plans || []);
        setWords(extraData.words || []);
      }

      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      if (!append) {
        setResults([]);
        setStories([]);
        setThemes([]);
        setPersons([]);
        setProphecies([]);
        setTimeline([]);
        setParallels([]);
        setPlans([]);
        setWords([]);
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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  function toggleSection(section: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  function visibleItems<T>(items: T[], section: string): T[] {
    return expandedSections.has(section) ? items : items.slice(0, MAX_EXTRA_RESULTS);
  }

  const hasExtraResults =
    (searchTypes.stories && stories.length > 0) ||
    (searchTypes.themes && themes.length > 0) ||
    (searchTypes.persons && persons.length > 0) ||
    (searchTypes.prophecies && prophecies.length > 0) ||
    (searchTypes.timeline && timeline.length > 0) ||
    (searchTypes.parallels && parallels.length > 0) ||
    (searchTypes.plans && plans.length > 0) ||
    (searchTypes.words && words.length > 0);

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
            {searchTypes.stories && stories.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Bibelhistorier</h2>
                <div className={styles.extraCards}>
                  {visibleItems(stories, 'stories').map((story) => (
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
                  <button onClick={() => toggleSection('stories')} className={styles.showAllLink}>
                    {expandedSections.has('stories')
                      ? 'Vis færre'
                      : `Vis alle ${stories.length} historier`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.themes && themes.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Temaer</h2>
                <div className={styles.extraCards}>
                  {visibleItems(themes, 'themes').map((theme) => (
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
                  <button onClick={() => toggleSection('themes')} className={styles.showAllLink}>
                    {expandedSections.has('themes')
                      ? 'Vis færre'
                      : `Vis alle ${themes.length} temaer`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.persons && persons.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Personer</h2>
                <div className={styles.extraCards}>
                  {visibleItems(persons, 'persons').map((person) => (
                    <Link
                      key={person.id}
                      to={`/personer/${person.id}`}
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {person.name}
                        <span className={styles.typeBadge}>Person</span>
                      </span>
                      {person.title && (
                        <span className={styles.extraCardMeta}>{person.title}</span>
                      )}
                      {person.summary && (
                        <span className={styles.extraCardDesc}>
                          {person.summary.length > 100
                            ? person.summary.slice(0, 100) + '...'
                            : person.summary}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                {persons.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('persons')} className={styles.showAllLink}>
                    {expandedSections.has('persons')
                      ? 'Vis færre'
                      : `Vis alle ${persons.length} personer`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.prophecies && prophecies.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Profetier</h2>
                <div className={styles.extraCards}>
                  {visibleItems(prophecies, 'prophecies').map((prophecy) => (
                    <Link
                      key={prophecy.id}
                      to="/profetier"
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {prophecy.title}
                        <span className={`${styles.typeBadge} ${styles.typeBadgeProphecy}`}>Profeti</span>
                      </span>
                      <span className={styles.extraCardMeta}>{prophecy.category_name} &middot; {prophecy.prophecy_ref}</span>
                      {prophecy.explanation && (
                        <span className={styles.extraCardDesc}>
                          {prophecy.explanation.length > 100
                            ? prophecy.explanation.slice(0, 100) + '...'
                            : prophecy.explanation}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                {prophecies.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('prophecies')} className={styles.showAllLink}>
                    {expandedSections.has('prophecies')
                      ? 'Vis færre'
                      : `Vis alle ${prophecies.length} profetier`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.timeline && timeline.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Tidslinje</h2>
                <div className={styles.extraCards}>
                  {visibleItems(timeline, 'timeline').map((event) => (
                    <Link
                      key={event.id}
                      to="/tidslinje"
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {event.title}
                        <span className={`${styles.typeBadge} ${styles.typeBadgeTimeline}`}>Tidslinje</span>
                      </span>
                      {event.year_display && (
                        <span className={styles.extraCardMeta}>{event.year_display}</span>
                      )}
                      {event.description && (
                        <span className={styles.extraCardDesc}>
                          {event.description.length > 100
                            ? event.description.slice(0, 100) + '...'
                            : event.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                {timeline.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('timeline')} className={styles.showAllLink}>
                    {expandedSections.has('timeline')
                      ? 'Vis færre'
                      : `Vis alle ${timeline.length} hendelser`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.parallels && parallels.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Evangelieparalleller</h2>
                <div className={styles.extraCards}>
                  {visibleItems(parallels, 'parallels').map((parallel) => (
                    <Link
                      key={parallel.id}
                      to="/paralleller"
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {parallel.title}
                        <span className={`${styles.typeBadge} ${styles.typeBadgeParallel}`}>Parallell</span>
                      </span>
                      <span className={styles.extraCardMeta}>{parallel.section_name}</span>
                    </Link>
                  ))}
                </div>
                {parallels.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('parallels')} className={styles.showAllLink}>
                    {expandedSections.has('parallels')
                      ? 'Vis færre'
                      : `Vis alle ${parallels.length} paralleller`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.plans && plans.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Leseplaner</h2>
                <div className={styles.extraCards}>
                  {visibleItems(plans, 'plans').map((plan) => (
                    <Link
                      key={plan.id}
                      to="/leseplan"
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {plan.name}
                        <span className={`${styles.typeBadge} ${styles.typeBadgePlan}`}>Leseplan</span>
                      </span>
                      {plan.category && (
                        <span className={styles.extraCardMeta}>{plan.category} &middot; {plan.days} dager</span>
                      )}
                      {plan.description && (
                        <span className={styles.extraCardDesc}>
                          {plan.description.length > 100
                            ? plan.description.slice(0, 100) + '...'
                            : plan.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                {plans.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('plans')} className={styles.showAllLink}>
                    {expandedSections.has('plans')
                      ? 'Vis færre'
                      : `Vis alle ${plans.length} leseplaner`}
                  </button>
                )}
              </div>
            )}

            {searchTypes.words && words.length > 0 && (
              <div className={styles.extraSection}>
                <h2 className={styles.extraSectionTitle}>Viktige ord</h2>
                <div className={styles.extraCards}>
                  {visibleItems(words, 'words').map((w, i) => (
                    <Link
                      key={`${w.book_id}-${w.chapter}-${w.word}-${i}`}
                      to={`/${toUrlSlug(w.book_short_name)}/${w.chapter}`}
                      className={styles.extraCard}
                    >
                      <span className={styles.extraCardTitle}>
                        {w.word}
                        <span className={`${styles.typeBadge} ${styles.typeBadgeWord}`}>Viktig ord</span>
                      </span>
                      <span className={styles.extraCardMeta}>{w.book_name_no} {w.chapter}</span>
                      <span className={styles.extraCardDesc}>
                        {w.explanation.length > 100
                          ? w.explanation.slice(0, 100) + '...'
                          : w.explanation}
                      </span>
                    </Link>
                  ))}
                </div>
                {words.length > MAX_EXTRA_RESULTS && (
                  <button onClick={() => toggleSection('words')} className={styles.showAllLink}>
                    {expandedSections.has('words')
                      ? 'Vis færre'
                      : `Vis alle ${words.length} viktige ord`}
                  </button>
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
