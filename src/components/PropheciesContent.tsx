import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProphecyView } from '@/components/ProphecyView';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { ProphecyCategory, Prophecy } from '@/lib/bible';
import styles from '@/styles/pages/prophecies.module.scss';

export function PropheciesContent() {
  const [categories, setCategories] = useState<ProphecyCategory[]>([]);
  const [prophecies, setProphecies] = useState<Prophecy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchProphecies() {
      try {
        const response = await fetch('/api/prophecies');

        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.offline) {
              setIsOffline(true);
              setError('Profetier er ikke lastet ned for offline bruk');
              return;
            }
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Check if response came from IndexedDB (via service worker)
        const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
        if (fromIndexedDB) {
          setIsOffline(true);
        }

        setCategories(data.categories || []);
        setProphecies(data.prophecies || []);
      } catch (err) {
        console.error('Failed to fetch prophecies:', err);
        setError('Kunne ikke laste profetier');
        setIsOffline(!navigator.onLine);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProphecies();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Profetier' }
          ]} />
          <h1>Profetier og oppfyllelser</h1>
          <p>Laster profetier...</p>
        </div>
      </div>
    );
  }

  if (error && prophecies.length === 0) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Profetier' }
          ]} />
          <h1>Profetier og oppfyllelser</h1>
          <p className={styles.error}>{error}</p>
          {isOffline && (
            <p>
              Du er offline. <Link to="/offline">Se hva som er tilgjengelig offline</Link>.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Profetier' }
        ]} />

        <h1>Profetier og oppfyllelser</h1>
        <p className={styles.intro}>
          En oversikt over profetier i Det gamle testamente og hvordan de ble oppfylt
          i Det nye testamente. Klikk på en profeti for å se forklaringen og bibelversene.
        </p>

        <ProphecyView
          categories={categories}
          prophecies={prophecies}
        />
      </div>
    </div>
  );
}
