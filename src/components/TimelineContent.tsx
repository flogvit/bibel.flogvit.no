import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MultiTimelineView } from '@/components/MultiTimelineView';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { MultiTimelineData } from '@/lib/bible';
import styles from '@/styles/pages/timeline.module.scss';

export function TimelineContent() {
  const [data, setData] = useState<MultiTimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const response = await fetch('/api/timeline/multi');

        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.offline) {
              setIsOffline(true);
              setError('Tidslinjen er ikke tilgjengelig offline');
              return;
            }
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
        if (fromIndexedDB) {
          setIsOffline(true);
        }

        setData(result);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
        setError('Kunne ikke laste tidslinjen');
        setIsOffline(!navigator.onLine);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimeline();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className={styles.wideContainer}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Tidslinje' }
          ]} />
          <h1>Bibelens tidslinje</h1>
          <p>Laster tidslinje...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.main}>
        <div className={styles.wideContainer}>
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Tidslinje' }
          ]} />
          <h1>Bibelens tidslinje</h1>
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
          { label: 'Tidslinje' }
        ]} />

        <h1>Bibelens tidslinje</h1>
        <p className={styles.intro}>
          En kronologisk oversikt over de viktigste hendelsene i Bibelen
          og verdenshistorien, fra skapelsen til den tidlige kirkens tid.
        </p>

        {data && <MultiTimelineView data={data} />}
      </div>
    </div>
  );
}
