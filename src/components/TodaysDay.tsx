import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksData } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import type { DayData, DayReference } from '@/lib/bible';
import styles from './TodaysDay.module.scss';

const categoryLabels: Record<string, string> = {
  advent: 'Advent',
  christmas: 'Jul',
  epiphany: 'Åpenbaring',
  lent: 'Faste',
  easter: 'Påske',
  ascension: 'Himmelfart',
  pentecost: 'Pinse',
  trinity: 'Treenighetstiden',
  special: 'Spesielle dager',
  jewish: 'Jødiske høytider',
};

function formatRef(ref: DayReference): string {
  const book = booksData.find(b => b.id === ref.bookId);
  const name = book?.name_no || `Bok ${ref.bookId}`;
  if (ref.fromVerseId === ref.toVerseId) {
    return `${name} ${ref.chapterId}:${ref.fromVerseId}`;
  }
  return `${name} ${ref.chapterId}:${ref.fromVerseId}-${ref.toVerseId}`;
}

function refToUrl(ref: DayReference): string {
  const book = booksData.find(b => b.id === ref.bookId);
  const slug = book ? toUrlSlug(book.short_name) : '';
  return `/${slug}/${ref.chapterId}#v${ref.fromVerseId}`;
}

export function TodaysDay() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodaysDays() {
      try {
        const response = await fetch('/api/days/today');
        if (!response.ok) return;
        const data = await response.json();
        setDays(data);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchTodaysDays();
  }, []);

  if (loading || days.length === 0) return null;

  return (
    <>
      {days.map(day => (
        <div key={day.id} className={styles.container}>
          <div className={styles.header}>
            <h3>
              <Link to={`/dager/${day.id}`} className={styles.dayLink}>{day.name}</Link>
            </h3>
            <span className={styles.category}>{categoryLabels[day.category] || day.category}</span>
          </div>

          <p className={styles.description}>{day.description}</p>

          {day.references && day.references.length > 0 && (
            <div className={styles.references}>
              <span className={styles.refLabel}>Dagens tekster:</span>
              {day.references.filter(r => r.relevance === 'primary').map((ref, i) => (
                <Link key={i} to={refToUrl(ref)} className={styles.refLink}>
                  {formatRef(ref)}
                </Link>
              ))}
              {day.references.filter(r => r.relevance === 'secondary').map((ref, i) => (
                <Link key={`s-${i}`} to={refToUrl(ref)} className={`${styles.refLink} ${styles.secondary}`}>
                  {formatRef(ref)}
                </Link>
              ))}
            </div>
          )}

          <Link to={`/dager/${day.id}`} className={styles.moreLink}>
            Les mer om {day.name} →
          </Link>
        </div>
      ))}
    </>
  );
}
