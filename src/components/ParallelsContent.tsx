import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ParallelsView } from '@/components/ParallelsView';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { GospelParallelSection, GospelParallel } from '@/lib/bible';
import styles from '@/styles/pages/parallels.module.scss';

export function ParallelsContent() {
  const [sections, setSections] = useState<GospelParallelSection[]>([]);
  const [parallels, setParallels] = useState<GospelParallel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchParallels() {
      try {
        const response = await fetch('/api/parallels');

        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.offline) {
              setIsOffline(true);
              setError('Parallelle tekster er ikke lastet ned for offline bruk');
              return;
            }
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
        if (fromIndexedDB) {
          setIsOffline(true);
        }

        setSections(data.sections || []);
        setParallels(data.parallels || []);
      } catch (err) {
        console.error('Failed to fetch parallels:', err);
        setError('Kunne ikke laste parallelle tekster');
        setIsOffline(!navigator.onLine);
      } finally {
        setIsLoading(false);
      }
    }

    fetchParallels();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className={styles.wideContainer}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Paralleller' }
          ]} />
          <h1>Parallelle evangelietekster</h1>
          <p>Laster parallelle tekster...</p>
        </div>
      </div>
    );
  }

  if (error && parallels.length === 0) {
    return (
      <div className={styles.main}>
        <div className={styles.wideContainer}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Paralleller' }
          ]} />
          <h1>Parallelle evangelietekster</h1>
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
      <div className={styles.wideContainer}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Paralleller' }
        ]} />

        <h1>Parallelle evangelietekster</h1>
        <p className={styles.intro}>
          Sammenlign parallelle tekster fra de fire evangeliene side ved side.
          Mange av Jesu ord og gjerninger er gjengitt i flere evangelier, ofte med
          små forskjeller i ordlyd og vinkling. Klikk på en parallell for å se tekstene.
        </p>

        <ParallelsView
          sections={sections}
          parallels={parallels}
        />
      </div>
    </div>
  );
}
