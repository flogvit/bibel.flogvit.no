'use client';

import Link from 'next/link';
import { useFavorites } from '@/components/FavoritesContext';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';

interface VerseWithText {
  bookId: number;
  chapter: number;
  verse: number;
  bookName: string;
  bookShortName: string;
  text: string;
}

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [versesWithText, setVersesWithText] = useState<VerseWithText[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerseTexts() {
      if (favorites.length === 0) {
        setVersesWithText([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites }),
        });
        const data = await response.json();
        setVersesWithText(data);
      } catch (error) {
        console.error('Failed to load favorite verses:', error);
      }
      setLoading(false);
    }

    loadVerseTexts();
  }, [favorites]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>← Tilbake</Link>
          <h1>Mine favoritter</h1>
          <p className={styles.intro}>
            Dine lagrede bibelvers. Klikk på stjernen ved et vers for å legge til eller fjerne favoritter.
          </p>
        </header>

        {loading ? (
          <p className={styles.loading}>Laster...</p>
        ) : favorites.length === 0 ? (
          <div className={styles.empty}>
            <p>Du har ingen favoritter ennå.</p>
            <p>Klikk på stjernen (☆) ved et vers for å legge det til her.</p>
          </div>
        ) : (
          <div className={styles.verseList}>
            {versesWithText.map((verse, index) => (
              <div key={index} className={styles.verseCard}>
                <div className={styles.cardHeader}>
                  <Link
                    href={`/${verse.bookShortName.toLowerCase()}/${verse.chapter}#v${verse.verse}`}
                    className={styles.reference}
                  >
                    {verse.bookName} {verse.chapter}:{verse.verse}
                  </Link>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeFavorite({ bookId: verse.bookId, chapter: verse.chapter, verse: verse.verse })}
                    title="Fjern fra favoritter"
                  >
                    ★
                  </button>
                </div>
                <p className={styles.text}>{verse.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
