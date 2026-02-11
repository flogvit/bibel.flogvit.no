import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/components/SettingsContext';
import { toUrlSlug } from '@/lib/url-utils';
import styles from './DailyVerse.module.scss';

interface DailyVerseData {
  date: string;
  reference: {
    bookId: number;
    bookName: string;
    shortName: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
    display: string;
  };
  text: string;
  note: string;
}

export function DailyVerse() {
  const { settings } = useSettings();
  const [verse, setVerse] = useState<DailyVerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bible = settings.bible?.startsWith('user:') ? 'osnb2' : (settings.bible || 'osnb2');

  useEffect(() => {
    async function fetchDailyVerse() {
      try {
        const response = await fetch(`/api/daily-verse?bible=${encodeURIComponent(bible)}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Ingen vers for i dag');
          } else {
            throw new Error('Failed to fetch');
          }
          return;
        }
        const data = await response.json();
        setVerse(data);
      } catch (err) {
        console.error('Error fetching daily verse:', err);
        setError('Kunne ikke hente dagens vers');
      } finally {
        setLoading(false);
      }
    }

    fetchDailyVerse();
  }, [bible]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Laster dagens vers...</div>
      </div>
    );
  }

  if (error || !verse) {
    return null;
  }

  const verseUrl = `/${toUrlSlug(verse.reference.shortName)}/${verse.reference.chapter}#v${verse.reference.verseStart}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Dagens vers</h3>
        <span className={styles.note}>{verse.note}</span>
      </div>

      <blockquote className={styles.verseText}>
        &laquo;{verse.text}&raquo;
      </blockquote>

      <Link to={verseUrl} className={styles.reference}>
        {verse.reference.display}
      </Link>
    </div>
  );
}
