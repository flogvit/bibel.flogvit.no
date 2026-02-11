import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { getBookInfoById } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import type { StoryData, VerseWithOriginal } from '@/lib/bible';
import styles from '@/styles/pages/story.module.scss';

const CATEGORIES: Record<string, string> = {
  skapelsen: 'Skapelsen',
  patriarkene: 'Patriarkene',
  moses: 'Moses',
  oerkenvandringen: 'Ørkenvandringen',
  landnaam: 'Landnåm',
  dommerne: 'Dommerne',
  kongetiden: 'Kongetiden',
  profetene: 'Profetene',
  eksil: 'Eksil',
  'jesus-liv': 'Jesu liv',
  'jesu-mirakler': 'Jesu mirakler',
  'jesu-lignelser': 'Jesu lignelser',
  'jesu-lidelse': 'Jesu lidelse',
  urkirken: 'Urkirken',
  paulus: 'Paulus',
};

interface ReferenceVerses {
  label: string;
  bookShortName: string;
  chapter: number;
  startVerse: number;
  verses: VerseWithOriginal[];
}

export function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [referenceVerses, setReferenceVerses] = useState<ReferenceVerses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [versesLoading, setVersesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchStory() {
      try {
        const response = await fetch(`/api/stories/${encodeURIComponent(slug!)}`);

        if (response.status === 404) {
          navigate('/historier', { replace: true });
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch story');

        const story = await response.json();
        const parsed: StoryData = JSON.parse(story.content);
        setStoryData(parsed);

        // Fetch verses for each reference
        setVersesLoading(true);
        const refVerses: ReferenceVerses[] = [];

        for (const ref of parsed.references) {
          const book = getBookInfoById(ref.bookId);
          if (!book) continue;

          // Build verse refs for this reference range
          const verseRefs: { bookId: number; chapter: number; verse: number }[] = [];

          for (let ch = ref.startChapter; ch <= ref.endChapter; ch++) {
            const fromVerse = ch === ref.startChapter ? ref.startVerse : 1;
            // For the end chapter, use endVerse; for other chapters, fetch up to a reasonable max
            const toVerse = ch === ref.endChapter ? ref.endVerse : 200;

            for (let v = fromVerse; v <= toVerse; v++) {
              verseRefs.push({ bookId: ref.bookId, chapter: ch, verse: v });
            }
          }

          try {
            const versesResponse = await fetch('/api/verses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refs: verseRefs }),
            });

            if (versesResponse.ok) {
              const verses: VerseWithOriginal[] = await versesResponse.json();

              // Build label
              let label: string;
              if (ref.startChapter === ref.endChapter) {
                label = `${book.short_name} ${ref.startChapter}:${ref.startVerse}-${ref.endVerse}`;
              } else {
                label = `${book.short_name} ${ref.startChapter}:${ref.startVerse} - ${ref.endChapter}:${ref.endVerse}`;
              }

              refVerses.push({
                label,
                bookShortName: book.short_name,
                chapter: ref.startChapter,
                startVerse: ref.startVerse,
                verses,
              });
            }
          } catch (err) {
            console.error('Error loading verses for reference:', err);
          }
        }

        setReferenceVerses(refVerses);
        setVersesLoading(false);
      } catch (err) {
        console.error('Failed to fetch story:', err);
        setError('Kunne ikke laste historie');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStory();
  }, [slug, navigate]);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Bibelhistorier', href: '/historier' },
            { label: 'Laster...' },
          ]} />
          <p>Laster historie...</p>
        </div>
      </div>
    );
  }

  if (error || !storyData) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Bibelhistorier', href: '/historier' },
            { label: 'Feil' },
          ]} />
          <h1>Feil</h1>
          <p>{error || 'Kunne ikke laste historie'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Bibelhistorier', href: '/historier' },
          { label: storyData.title },
        ]} />

        <h1>{storyData.title}</h1>

        <Link
          to={`/historier?kategori=${storyData.category}`}
          className={styles.categoryLink}
        >
          {CATEGORIES[storyData.category] || storyData.category}
        </Link>

        {storyData.description && (
          <p className={styles.description}>{storyData.description}</p>
        )}

        {storyData.keywords && storyData.keywords.length > 0 && (
          <div className={styles.keywords}>
            {storyData.keywords.map((keyword, i) => (
              <span key={i} className={styles.keyword}>{keyword}</span>
            ))}
          </div>
        )}

        <div className={styles.referenceSection}>
          <h2>Bibeltekst</h2>

          {versesLoading ? (
            <p className={styles.loadingVerses}>Laster bibelvers...</p>
          ) : (
            referenceVerses.map((refGroup, groupIndex) => (
              <div key={groupIndex} className={styles.referenceGroup}>
                <div className={styles.referenceHeader}>
                  <Link
                    to={`/${toUrlSlug(refGroup.bookShortName)}/${refGroup.chapter}#v${refGroup.startVerse}`}
                    className={styles.referenceLabel}
                  >
                    {refGroup.label}
                  </Link>
                  <Link
                    to={`/${toUrlSlug(refGroup.bookShortName)}/${refGroup.chapter}#v${refGroup.startVerse}`}
                    className={styles.openContext}
                  >
                    Vis i kontekst
                  </Link>
                </div>

                {refGroup.verses.map((verseData, verseIndex) => (
                  <div key={verseIndex} className={styles.verseCard}>
                    <VerseDisplay
                      verse={verseData.verse}
                      bookId={verseData.verse.book_id}
                      originalText={verseData.originalText || undefined}
                      originalLanguage={verseData.originalLanguage}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
