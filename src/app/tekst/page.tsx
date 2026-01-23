'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { VerseWithOriginal, VerseRef, Book } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface ParsedRef {
  bookSlug: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

function parseRefs(refsParam: string | null): ParsedRef[] {
  if (!refsParam) return [];

  return refsParam.split(',').map(ref => {
    const parts = ref.trim().split('-');
    if (parts.length < 3) return null;

    const bookSlug = parts[0];
    const chapter = parseInt(parts[1], 10);
    const verseStart = parseInt(parts[2], 10);
    const verseEnd = parts[3] ? parseInt(parts[3], 10) : verseStart;

    if (isNaN(chapter) || isNaN(verseStart) || isNaN(verseEnd)) {
      return null;
    }

    return { bookSlug, chapter, verseStart, verseEnd };
  }).filter((ref): ref is ParsedRef => ref !== null);
}

function PassageContent() {
  const searchParams = useSearchParams();
  const refsParam = searchParams.get('refs');
  const parsedRefs = parseRefs(refsParam);

  const [verses, setVerses] = useState<VerseWithOriginal[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (parsedRefs.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // First, fetch books to resolve slugs to book IDs
        const booksResponse = await fetch('/api/books');
        if (!booksResponse.ok) throw new Error('Failed to fetch books');
        const booksData: Book[] = await booksResponse.json();
        setBooks(booksData);

        // Convert parsed refs to VerseRef format
        const verseRefs: VerseRef[] = [];
        for (const ref of parsedRefs) {
          const book = booksData.find(b => toUrlSlug(b.short_name) === ref.bookSlug);
          if (!book) {
            console.warn(`Book not found for slug: ${ref.bookSlug}`);
            continue;
          }

          const verseNumbers: number[] = [];
          for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
            verseNumbers.push(v);
          }

          verseRefs.push({
            bookId: book.id,
            chapter: ref.chapter,
            verses: verseNumbers,
          });
        }

        if (verseRefs.length === 0) {
          setError('Ingen gyldige referanser funnet');
          setLoading(false);
          return;
        }

        // Fetch verses
        const versesResponse = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs: verseRefs }),
        });

        if (!versesResponse.ok) throw new Error('Failed to fetch verses');
        const versesData: VerseWithOriginal[] = await versesResponse.json();
        setVerses(versesData);
      } catch (err) {
        console.error('Error loading passages:', err);
        setError('Kunne ikke laste bibelvers');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refsParam]);

  if (!refsParam || parsedRefs.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Ingen passasjer valgt</h2>
        <p>
          Bruk URL-parametere for å vise bibelpassasjer.<br />
          Format: <code>/tekst?refs=1mo-4-1-16,1mo-3-1-24</code>
        </p>
        <p>
          Referanseformat: <code>bok-kapittel-versstart-versslutt</code>
        </p>
        <ul>
          <li><code>1mo-1-1-5</code> = 1. Mosebok 1:1-5</li>
          <li><code>joh-3-16</code> = Johannes 3:16 (enkeltvers)</li>
          <li><code>mat-5-1-12,luk-6-20-26</code> = Flere passasjer</li>
        </ul>
      </div>
    );
  }

  if (loading) {
    return <p className={styles.loading}>Laster bibelvers...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  // Group verses by book/chapter
  const groupedVerses: { key: string; bookShortName: string; chapter: number; verses: VerseWithOriginal[] }[] = [];

  for (const verse of verses) {
    const key = `${verse.verse.book_id}-${verse.verse.chapter}`;
    let group = groupedVerses.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        bookShortName: verse.bookShortName,
        chapter: verse.verse.chapter,
        verses: [],
      };
      groupedVerses.push(group);
    }
    group.verses.push(verse);
  }

  return (
    <div className={styles.passages}>
      {groupedVerses.map((group, groupIndex) => {
        const firstVerse = group.verses[0]?.verse.verse;
        const lastVerse = group.verses[group.verses.length - 1]?.verse.verse;
        const verseRange = firstVerse === lastVerse ? `${firstVerse}` : `${firstVerse}-${lastVerse}`;
        const contextUrl = `/${toUrlSlug(group.bookShortName)}/${group.chapter}#v${firstVerse}`;

        return (
          <div key={groupIndex} className={styles.passage}>
            <div className={styles.passageHeader}>
              <h2>
                <Link href={contextUrl}>
                  {group.bookShortName} {group.chapter}:{verseRange}
                </Link>
              </h2>
              <Link href={contextUrl} className={styles.contextLink}>
                Vis i kontekst →
              </Link>
            </div>

            <div className={styles.verseList}>
              {group.verses.map((verseData, verseIndex) => (
                <div key={verseIndex} className={styles.verse}>
                  <span className={styles.verseNumber}>{verseData.verse.verse}</span>
                  <VerseDisplay
                    verse={verseData.verse}
                    bookId={verseData.verse.book_id}
                    originalText={verseData.originalText || undefined}
                    originalLanguage={verseData.originalLanguage}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TekstPage() {
  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Bibelpassasjer' }
        ]} />

        <h1>Bibelpassasjer</h1>

        <Suspense fallback={<p className={styles.loading}>Laster...</p>}>
          <PassageContent />
        </Suspense>
      </div>
    </div>
  );
}
