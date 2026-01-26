import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VerseDisplay } from './VerseDisplay';
import type { ThemeData, ThemeSection, ThemeVerseRef } from '@/lib/bible';
import type { VerseWithOriginal } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import styles from '@/styles/pages/theme.module.scss';

interface ThemeVerseDisplayProps {
  themeData: ThemeData;
}

interface SectionWithVerses extends ThemeSection {
  loadedVerses: VerseWithOriginal[];
}

export function ThemeVerseDisplay({ themeData }: ThemeVerseDisplayProps) {
  const [sections, setSections] = useState<SectionWithVerses[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerses() {
      // Samle alle vers-referanser fra alle seksjoner
      const allRefs: ThemeVerseRef[] = [];
      for (const section of themeData.sections) {
        allRefs.push(...section.verses);
      }

      try {
        const response = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs: allRefs }),
        });

        if (!response.ok) throw new Error('Failed to fetch verses');

        const verses: VerseWithOriginal[] = await response.json();

        // Fordel versene tilbake til seksjonene
        let verseIndex = 0;
        const loadedSections: SectionWithVerses[] = themeData.sections.map(section => {
          const sectionVerses: VerseWithOriginal[] = [];

          for (const ref of section.verses) {
            const count = ref.verses?.length || (ref.verse ? 1 : 0);
            for (let i = 0; i < count; i++) {
              if (verseIndex < verses.length) {
                sectionVerses.push(verses[verseIndex]);
                verseIndex++;
              }
            }
          }

          return {
            ...section,
            loadedVerses: sectionVerses,
          };
        });

        setSections(loadedSections);
      } catch (error) {
        console.error('Error loading verses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [themeData]);

  if (loading) {
    return <p>Laster bibelvers...</p>;
  }

  return (
    <>
      {themeData.introduction && (
        <p className={styles.introduction}>{themeData.introduction}</p>
      )}

      <div className={styles.sections}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={styles.section}>
            <h2>{section.title}</h2>
            {section.description && (
              <p className={styles.sectionDescription}>{section.description}</p>
            )}

            {section.loadedVerses.map((verseData, verseIndex) => (
              <div key={verseIndex} className={styles.verseGroup}>
                <div className={styles.verseHeader}>
                  <Link
                    to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                    className={styles.verseRef}
                  >
                    {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                  </Link>
                  <Link
                    to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                    className={styles.openContext}
                  >
                    Vis i kontekst →
                  </Link>
                </div>
                <VerseDisplay
                  verse={verseData.verse}
                  bookId={verseData.verse.book_id}
                  originalText={verseData.originalText || undefined}
                  originalLanguage={verseData.originalLanguage}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
