import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChapter } from '@/hooks/useChapter';
import { useTimeline } from '@/hooks/useTimeline';
import { useChapterParallels } from '@/hooks/useChapterParallels';
import { getStoredChapter } from '@/lib/offline/storage';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { Summary } from '@/components/bible/Summary';
import { ImportantWords } from '@/components/bible/ImportantWords';
import { ChapterInsightsPanel } from '@/components/bible/ChapterInsightsPanel';
import { ChapterParallelsView } from '@/components/bible/ChapterParallelsView';
import { ToolsPanel } from '@/components/bible/ToolsPanel';
import { MobileToolbar } from '@/components/bible/MobileToolbar';
import { ScrollToVerse } from '@/components/bible/ScrollToVerse';
import { TimelinePanel } from '@/components/bible/TimelinePanel';
import { ChapterKeyboardShortcuts } from '@/components/bible/ChapterKeyboardShortcuts';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReadingModeWrapper } from '@/components/bible/ReadingModeWrapper';
import { ReadingPositionTracker } from '@/components/bible/ReadingPositionTracker';
import { useSettings } from '@/components/SettingsContext';
import styles from '@/styles/pages/chapter.module.scss';

interface ChapterContentProps {
  bookId: number;
  bookName: string;
  bookSlug: string;
  chapter: number;
  maxChapter: number;
  nextBookName?: string;
  nextBookSlug?: string;
  bible?: string;
  // Server-rendered initial data (for hydration)
  initialData?: {
    verses: Array<{
      id: number;
      book_id: number;
      chapter: number;
      verse: number;
      text: string;
      bible: string;
    }>;
    originalVerses: Array<{ verse: number; text: string }>;
    summary: string | null;
    context: string | null;
    insight: unknown | null;
  };
}

export function ChapterContent({
  bookId,
  bookName,
  bookSlug,
  chapter,
  maxChapter,
  nextBookName,
  nextBookSlug,
  bible = 'osnb2',
  initialData,
}: ChapterContentProps) {
  const bibleQuery = bible !== 'osnb2' ? `?bible=${bible}` : '';
  const { settings } = useSettings();

  const secondaryBible = settings.showOriginalText ? settings.secondaryBible : undefined;

  // Use client-side data fetching
  const { data, isLoading, error, isOffline } = useChapter({
    bookId,
    chapter,
    bible,
    secondaryBible,
  });

  // Fetch timeline events (shared between desktop sidebar and mobile toolbar)
  const { events: timelineEvents } = useTimeline();

  // Fetch parallels for gospel chapters
  const { parallels, hasParallels } = useChapterParallels(bookId, chapter);

  // Use initial data for SSR, then switch to client data
  const verses = data?.verses || initialData?.verses || [];
  const originalVerses = data?.originalVerses || initialData?.originalVerses || [];
  const bookSummary = data?.bookSummary ?? null;
  const summary = data?.summary ?? initialData?.summary ?? null;
  const context = data?.context ?? initialData?.context ?? null;
  const insight = data?.insight ?? initialData?.insight ?? null;
  const word4word = data?.word4word || {};
  const references = data?.references || {};

  // Create a map of original verses by verse number
  const originalVersesMap = useMemo(
    () => new Map(originalVerses.map(v => [v.verse, v.text])),
    [originalVerses]
  );

  // Fetch user bible secondary verses from IndexedDB
  const [userSecondaryVerses, setUserSecondaryVerses] = useState<{ verse: number; text: string }[]>([]);
  useEffect(() => {
    if (!secondaryBible || !secondaryBible.startsWith('user:')) {
      setUserSecondaryVerses([]);
      return;
    }
    getStoredChapter(bookId, chapter, secondaryBible).then(cached => {
      if (cached?.verses) {
        setUserSecondaryVerses(cached.verses.map(v => ({ verse: v.verse, text: v.text })));
      } else {
        setUserSecondaryVerses([]);
      }
    });
  }, [bookId, chapter, secondaryBible]);

  // Create a map of secondary verses by verse number
  const secondaryVersesData = secondaryBible?.startsWith('user:')
    ? userSecondaryVerses
    : (data?.secondaryVerses || []);
  const secondaryVersesMap = useMemo(
    () => new Map(secondaryVersesData.map(v => [v.verse, v.text])),
    [secondaryVersesData]
  );

  // Determine original language based on book
  const originalLanguage = bookId <= 39 ? 'hebrew' : 'greek';

  // Show loading state only if we have no data at all
  if (isLoading && !verses.length && !initialData?.verses?.length) {
    return (
      <ReadingModeWrapper className={styles.main}>
        <div className={styles.loading}>
          <p>Laster {bookName} {chapter}...</p>
        </div>
      </ReadingModeWrapper>
    );
  }

  // Show error state
  if (error && !verses.length) {
    return (
      <ReadingModeWrapper className={styles.main}>
        <div className={styles.error}>
          <h1>Kunne ikke laste kapittelet</h1>
          <p>{error}</p>
          {isOffline && (
            <p className={styles.offlineHint}>
              Du er offline. <Link to="/offline">Se hva som er tilgjengelig offline</Link>.
            </p>
          )}
        </div>
      </ReadingModeWrapper>
    );
  }

  return (
    <ReadingModeWrapper className={styles.main}>
      <ScrollToVerse />
      <ReadingPositionTracker
        bookId={bookId}
        chapter={chapter}
        bookSlug={bookSlug}
        bookName={bookName}
      />
      <ChapterKeyboardShortcuts
        bookSlug={bookSlug}
        currentChapter={chapter}
        maxChapter={maxChapter}
        nextBookSlug={nextBookSlug || null}
        bibleQuery={bibleQuery}
      />

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Kapittelnavigasjon og innstillinger">
          <nav className={styles.nav} aria-label="Kapittelliste">
            <Link to="/" className={styles.backLink}>← Alle bøker</Link>
            <span className={styles.navTitle}>{bookName}</span>
            <div className={styles.chapterList}>
              {Array.from({ length: maxChapter }, (_, i) => i + 1).map(ch => (
                <Link
                  key={ch}
                  to={`/${bookSlug}/${ch}${bibleQuery}`}
                  className={`${styles.chapterLink} ${ch === chapter ? styles.active : ''}`}
                >
                  {ch}
                </Link>
              ))}
            </div>
          </nav>
          <ToolsPanel hasParallels={hasParallels} />
        </aside>

        <article className={styles.content}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: bookName, href: `/${bookSlug}/1${bibleQuery}` },
            { label: `Kapittel ${chapter}` }
          ]} />
          <header className={styles.header}>
            <h1>{bookName} {chapter}</h1>
            <div className={styles.navButtons}>
              {chapter > 1 && (
                <Link to={`/${bookSlug}/${chapter - 1}${bibleQuery}`} className={styles.navButton}>
                  ← Forrige
                </Link>
              )}
              {chapter < maxChapter ? (
                <Link to={`/${bookSlug}/${chapter + 1}${bibleQuery}`} className={styles.navButton}>
                  Neste →
                </Link>
              ) : nextBookSlug && (
                <Link to={`/${nextBookSlug}/1${bibleQuery}`} className={styles.navButton}>
                  {nextBookName} →
                </Link>
              )}
            </div>
          </header>

          {bookSummary && (
            <Summary
              type="book"
              title={`Om ${bookName}`}
              content={bookSummary}
            />
          )}

          {summary && (
            <Summary
              type="chapter"
              title={`Kapittel ${chapter}`}
              content={summary}
            />
          )}

          {context && (
            <Summary
              type="context"
              title="Historisk kontekst"
              content={context}
            />
          )}

          <ImportantWords bookId={bookId} chapter={chapter} />

          <ChapterInsightsPanel bookId={bookId} chapter={chapter} insight={insight} />

          {settings.showParallels && hasParallels && (
            <ChapterParallelsView
              bookId={bookId}
              chapter={chapter}
              parallels={parallels}
              bible={bible}
            />
          )}

          <section className={styles.verses}>
            {verses.map(verse => (
              <VerseDisplay
                key={`${verse.bible}-${verse.verse}`}
                verse={verse}
                bookId={bookId}
                originalText={originalVersesMap.get(verse.verse)}
                originalLanguage={originalLanguage}
                secondaryText={
                  settings.secondaryBible === 'original'
                    ? undefined
                    : secondaryVersesMap.get(verse.verse)
                }
                initialWord4Word={word4word[verse.verse]}
                initialReferences={references[verse.verse]}
              />
            ))}
          </section>

          <footer className={styles.footer}>
            <div className={styles.navButtons}>
              {chapter > 1 && (
                <Link to={`/${bookSlug}/${chapter - 1}${bibleQuery}`} className={styles.navButton}>
                  ← Forrige kapittel
                </Link>
              )}
              {chapter < maxChapter ? (
                <Link to={`/${bookSlug}/${chapter + 1}${bibleQuery}`} className={styles.navButton}>
                  Neste kapittel →
                </Link>
              ) : nextBookSlug && (
                <Link to={`/${nextBookSlug}/1${bibleQuery}`} className={styles.navButton}>
                  {nextBookName} →
                </Link>
              )}
            </div>
          </footer>
        </article>

        <aside className={styles.rightSidebar} aria-label="Tidslinje">
          <TimelinePanel
            events={timelineEvents}
            currentBookId={bookId}
            currentChapter={chapter}
          />
        </aside>
      </div>
      <MobileToolbar
        bookName={bookName}
        chapter={chapter}
        maxChapter={maxChapter}
        bookSlug={bookSlug}
        bookId={bookId}
        timelineEvents={timelineEvents}
        hasParallels={hasParallels}
      />
    </ReadingModeWrapper>
  );
}
