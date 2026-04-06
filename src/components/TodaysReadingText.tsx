import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksData } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import styles from './TodaysDay.module.scss';

interface ReadingRef {
  title: string | null;
  display_ref: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
}

interface ReadingTextWithRefs {
  id: number;
  date: string;
  name: string;
  series: string | null;
  readings: ReadingRef[];
}

function refToUrl(ref: ReadingRef): string {
  const book = booksData.find(b => b.id === ref.book_id);
  const slug = book ? toUrlSlug(book.short_name) : '';
  return `/${slug}/${ref.chapter}#v${ref.verse_start}`;
}

function extractDisplayText(displayRef: string): string {
  // Extract display text from [ref:...|display text] format
  const match = displayRef.match(/\|([^\]]+)\]/);
  return match ? match[1] : displayRef;
}

export function TodaysReadingText() {
  const [texts, setTexts] = useState<ReadingTextWithRefs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reading-texts/today')
      .then(res => res.json())
      .then(data => setTexts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || texts.length === 0) return null;

  return (
    <>
      {texts.map(text => (
        <div key={text.id} className={styles.container}>
          <div className={styles.header}>
            <h3>
              <Link to={`/lesetekster/${text.id}`} className={styles.dayLink}>{text.name}</Link>
            </h3>
            {text.series && <span className={styles.category}>{text.series}</span>}
          </div>

          <div className={styles.references}>
            <span className={styles.refLabel}>Lesetekster:</span>
            {text.readings.map((ref, i) => (
              <Link key={i} to={refToUrl(ref)} className={styles.refLink} title={ref.title || undefined}>
                {extractDisplayText(ref.display_ref)}
              </Link>
            ))}
          </div>

          <Link to={`/lesetekster/${text.id}`} className={styles.moreLink}>
            Se alle lesetekster →
          </Link>
        </div>
      ))}
    </>
  );
}
