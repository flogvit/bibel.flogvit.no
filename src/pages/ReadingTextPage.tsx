import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettings } from '@/components/SettingsContext';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import styles from '@/styles/pages/day.module.scss';

interface EnrichedVerse {
  chapter: number;
  verse: number;
  text: string;
  part?: string;
}

interface ReadingRef {
  id: number;
  title: string | null;
  display_ref: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  sort_order: number;
}

interface ReadingTextResponse {
  id: number;
  date: string;
  name: string;
  series: string | null;
  readings: ReadingRef[];
  verses: Record<string, EnrichedVerse[]>;
}

function extractDisplayText(displayRef: string): string {
  const match = displayRef.match(/\|([^\]]+)\]/);
  return match ? match[1] : displayRef.replace(/^\[ref:|@\w+\]$/g, '').replace(/\]$/, '');
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatVerseNum(v: EnrichedVerse): string {
  return `${v.verse}${v.part || ''}`;
}

export function ReadingTextPage() {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const [data, setData] = useState<ReadingTextResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const bible = settings.bible || 'osnb2';
  const mapping = settings.numberingSystem || 'osnb2';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (bible !== 'osnb2') params.set('bible', bible);
    if (mapping !== 'osnb2') params.set('mapping', mapping);
    const qs = params.toString();
    fetch(`/api/reading-texts/${id}${qs ? '?' + qs : ''}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        document.title = `${result.name} | bibel.flogvit.no`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, bible, mapping]);

  if (loading) return <main className={styles.main}><div className="reading-container"><p>Laster...</p></div></main>;
  if (!data) return <main className={styles.main}><div className="reading-container"><p>Fant ikke leseteksten.</p></div></main>;

  // Group readings by unique display_ref
  const uniqueReadings: { displayRef: string; title: string | null }[] = [];
  const seen = new Set<string>();
  for (const r of data.readings) {
    if (!seen.has(r.display_ref)) {
      seen.add(r.display_ref);
      uniqueReadings.push({ displayRef: r.display_ref, title: r.title });
    }
  }

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Lesetekster', href: '/lesetekster' },
          { label: data.name },
        ]} />

        <h1>{data.name}</h1>
        <div className={styles.meta}>
          <span className={styles.nextDate}>{formatDate(data.date)}</span>
          {data.series && <span className={styles.categoryBadge}>Rekke {data.series}</span>}
        </div>

        {uniqueReadings.map((reading, i) => {
          const verseData = data.verses[reading.displayRef] || [];
          return (
            <section key={i} className={styles.contentSection}>
              <h2>{reading.title || extractDisplayText(reading.displayRef)}</h2>
              <p className={styles.nextDate} style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                {extractDisplayText(reading.displayRef)}
              </p>
              {verseData.length > 0 ? (
                <div style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
                  {verseData.map((v, vi) => (
                    <span key={vi}>
                      <sup style={{ color: 'var(--color-secondary, #8b7355)', marginRight: '0.25rem', fontSize: '0.75rem' }}>
                        {formatVerseNum(v)}
                      </sup>
                      {v.text}{' '}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted, #999)', fontStyle: 'italic' }}>
                  Verstekst ikke tilgjengelig for denne oversettelsen.
                </p>
              )}
            </section>
          );
        })}

        <Link to="/lesetekster" style={{ color: 'var(--color-secondary, #8b7355)', fontSize: '0.9rem' }}>
          ← Alle lesetekster
        </Link>
      </div>
    </main>
  );
}
