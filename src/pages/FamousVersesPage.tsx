import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toUrlSlug } from '@/lib/url-utils';
import styles from '@/styles/pages/famous-verses.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface WellKnownVerse {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  verse_text: string;
}

export function FamousVersesPage() {
  const [verses, setVerses] = useState<WellKnownVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerses() {
      try {
        const response = await fetch('/api/wellknown-verses');
        if (!response.ok) throw new Error('Failed to fetch verses');
        const data = await response.json();
        setVerses(data);
      } catch (err) {
        console.error('Failed to fetch well-known verses:', err);
        setError('Kunne ikke laste versene');
      } finally {
        setLoading(false);
      }
    }

    fetchVerses();
  }, []);

  // Group by testament
  const otVerses = verses.filter(v => v.book_id <= 39);
  const ntVerses = verses.filter(v => v.book_id >= 40);

  if (loading) {
    return (
      <div className={styles.main}>
        <div className={styles.container}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Kjente vers' }
          ]} />
          <h1>Kjente bibelvers</h1>
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.main}>
        <div className={styles.container}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Kjente vers' }
          ]} />
          <h1>Kjente bibelvers</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Kjente vers' }
        ]} />
        <header className={styles.header}>
          <h1>Kjente bibelvers</h1>
          <p className={styles.intro}>
            En samling av kjente og ofte siterte bibelvers. Klikk på et vers for å lese det i kontekst.
          </p>
        </header>

        <section className={styles.section}>
          <h2>Det nye testamente ({ntVerses.length} vers)</h2>
          <div className={styles.verseList}>
            {ntVerses.map((verse, index) => (
              <Link
                key={`nt-${index}`}
                to={`/${toUrlSlug(verse.book_short_name)}/${verse.chapter}#v${verse.verse}`}
                className={styles.verseCard}
              >
                <span className={styles.reference}>
                  {verse.book_name_no} {verse.chapter}:{verse.verse}
                </span>
                <p className={styles.text}>{verse.verse_text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Det gamle testamente ({otVerses.length} vers)</h2>
          <div className={styles.verseList}>
            {otVerses.map((verse, index) => (
              <Link
                key={`ot-${index}`}
                to={`/${toUrlSlug(verse.book_short_name)}/${verse.chapter}#v${verse.verse}`}
                className={styles.verseCard}
              >
                <span className={styles.reference}>
                  {verse.book_name_no} {verse.chapter}:{verse.verse}
                </span>
                <p className={styles.text}>{verse.verse_text}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
