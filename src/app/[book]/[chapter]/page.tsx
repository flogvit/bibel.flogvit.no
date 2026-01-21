import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getBookByShortName,
  getBookUrlSlug,
  getVerses,
  getOriginalVerses,
  getOriginalLanguage,
  getChapterSummary,
  getBookSummary,
  Book,
  Verse,
} from '@/lib/bible';
import styles from './page.module.scss';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { ToolsPanel } from '@/components/bible/ToolsPanel';
import { MobileToolbar } from '@/components/bible/MobileToolbar';
import { ScrollToVerse } from '@/components/bible/ScrollToVerse';
import { Summary } from '@/components/bible/Summary';
import { ImportantWords } from '@/components/bible/ImportantWords';

interface PageProps {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
  searchParams: Promise<{
    bible?: string;
  }>;
}

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params;
  const { bible: bibleParam } = await searchParams;
  const chapter = parseInt(chapterStr);
  const bible = bibleParam === 'osnn1' ? 'osnn1' : 'osnb1';

  const book = getBookByShortName(bookSlug);
  if (!book || isNaN(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  // Use ASCII-safe URL slug for all internal links
  const urlSlug = getBookUrlSlug(book);
  const bibleQuery = bible !== 'osnb1' ? `?bible=${bible}` : '';

  const verses = getVerses(book.id, chapter, bible);
  const originalVerses = getOriginalVerses(book.id, chapter);
  const originalLanguage = getOriginalLanguage(book.id);
  const chapterSummary = getChapterSummary(book.id, chapter);
  const bookSummary = chapter === 1 ? getBookSummary(book.id) : null;

  // Create a map of original verses by verse number
  const originalVersesMap = new Map(originalVerses.map(v => [v.verse, v.text]));

  return (
    <main className={styles.main}>
      <ScrollToVerse />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.backLink}>← Alle bøker</Link>
            <h3>{book.name_no}</h3>
            <div className={styles.chapterList}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                <Link
                  key={ch}
                  href={`/${urlSlug}/${ch}${bibleQuery}`}
                  className={`${styles.chapterLink} ${ch === chapter ? styles.active : ''}`}
                >
                  {ch}
                </Link>
              ))}
            </div>
          </nav>
          <ToolsPanel />
        </aside>

        <article className={styles.content}>
          <header className={styles.header}>
            <h1>{book.name_no} {chapter}</h1>
            <div className={styles.navButtons}>
              {chapter > 1 && (
                <Link href={`/${urlSlug}/${chapter - 1}${bibleQuery}`} className={styles.navButton}>
                  ← Forrige
                </Link>
              )}
              {chapter < book.chapters && (
                <Link href={`/${urlSlug}/${chapter + 1}${bibleQuery}`} className={styles.navButton}>
                  Neste →
                </Link>
              )}
            </div>
          </header>

          {bookSummary && (
            <Summary
              type="book"
              title={`Om ${book.name_no}`}
              content={bookSummary}
            />
          )}

          {chapterSummary && (
            <Summary
              type="chapter"
              title={`Kapittel ${chapter}`}
              content={chapterSummary}
            />
          )}

          <ImportantWords bookId={book.id} chapter={chapter} />

          <section className={styles.verses}>
            {verses.map(verse => (
              <VerseDisplay
                key={verse.id}
                verse={verse}
                bookId={book.id}
                originalText={originalVersesMap.get(verse.verse)}
                originalLanguage={originalLanguage}
              />
            ))}
          </section>

          <footer className={styles.footer}>
            <div className={styles.navButtons}>
              {chapter > 1 && (
                <Link href={`/${urlSlug}/${chapter - 1}${bibleQuery}`} className={styles.navButton}>
                  ← Forrige kapittel
                </Link>
              )}
              {chapter < book.chapters && (
                <Link href={`/${urlSlug}/${chapter + 1}${bibleQuery}`} className={styles.navButton}>
                  Neste kapittel →
                </Link>
              )}
            </div>
          </footer>
        </article>
      </div>
      <MobileToolbar
        bookName={book.name_no}
        chapter={chapter}
        maxChapter={book.chapters}
        bookSlug={urlSlug}
      />
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params;
  const book = getBookByShortName(bookSlug);
  const chapter = parseInt(chapterStr);

  if (!book) {
    return { title: 'Ikke funnet' };
  }

  return {
    title: `${book.name_no} ${chapter} - Bibelen`,
    description: `Les ${book.name_no} kapittel ${chapter} på norsk`,
  };
}
