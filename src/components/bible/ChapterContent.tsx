import { useMemo, useState, useEffect, useRef } from 'react';
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

  const numberingSystem = settings.numberingSystem || 'osnb2';

  // Use client-side data fetching
  const { data, isLoading, error, isOffline } = useChapter({
    bookId,
    chapter,
    bible,
    secondaryBible,
    numberingSystem,
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

  // Copy handler: intercept copy events to include verse numbers and clean formatting
  const versesRef = useRef<HTMLElement>(null);
  useEffect(() => {
    function handleCopy(e: ClipboardEvent) {
      const section = versesRef.current;
      if (!section) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // Only intercept if selection is within the verses section
      if (!section.contains(range.startContainer) && !section.contains(range.endContainer)) return;

      const verseElements = section.querySelectorAll<HTMLElement>('[data-verse-num]');
      const parts: { num: string; text: string }[] = [];

      for (const verseEl of verseElements) {
        if (!selection.containsNode(verseEl, true)) continue;

        const verseNum = verseEl.dataset.verseNum || '';
        const textSpan = verseEl.querySelector<HTMLElement>('[data-verse-text]');
        if (!textSpan) continue;

        const isFullySelected = selection.containsNode(verseEl, false);

        if (isFullySelected) {
          parts.push({ num: verseNum, text: textSpan.textContent?.trim() || '' });
        } else {
          // Partially selected verse - extract just the selected portion
          try {
            const verseRange = document.createRange();
            verseRange.selectNodeContents(textSpan);

            if (range.compareBoundaryPoints(Range.START_TO_START, verseRange) > 0) {
              verseRange.setStart(range.startContainer, range.startOffset);
            }
            if (range.compareBoundaryPoints(Range.END_TO_END, verseRange) < 0) {
              verseRange.setEnd(range.endContainer, range.endOffset);
            }

            const selectedText = verseRange.toString().trim();
            if (selectedText) {
              parts.push({ num: verseNum, text: selectedText });
            }
          } catch {
            // Fallback: use full verse text
            parts.push({ num: verseNum, text: textSpan.textContent?.trim() || '' });
          }
        }
      }

      if (parts.length === 0) return;

      e.preventDefault();

      // Plain text: "1 Text here\n2 More text"
      const plainText = parts.map(p => `${p.num} ${p.text}`).join('\n');

      // HTML: clean formatting for Word/rich text editors
      const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const htmlLines = parts.map(p =>
        `<p style="margin:0 0 4px 0;line-height:1.6;"><sup style="color:#8b7355;font-size:0.75em;">${escHtml(p.num)}</sup> ${escHtml(p.text)}</p>`
      ).join('\n');
      const html = `<div style="font-family:Georgia,serif;font-size:12pt;color:#333333;background:white;">${htmlLines}</div>`;

      e.clipboardData?.setData('text/plain', plainText);
      e.clipboardData?.setData('text/html', html);
    }

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

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

          <section className={styles.verses} ref={versesRef}>
            {verses.map(verse => {
              const displayInfo = data?.displayMap?.[verse.id];
              const displayVerse = displayInfo?.verse;
              return (
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
                displayVerse={displayVerse}
              />
              );
            })}
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
