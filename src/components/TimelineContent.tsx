import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TimelineView } from '@/components/TimelineView';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { TimelinePeriod, TimelineEvent } from '@/lib/bible';
import styles from '@/styles/pages/timeline.module.scss';

export function TimelineContent() {
  const [periods, setPeriods] = useState<TimelinePeriod[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const response = await fetch('/api/timeline');

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

        const data = await response.json();

        // Check if response came from IndexedDB
        const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
        if (fromIndexedDB) {
          setIsOffline(true);
        }

        setPeriods(data.periods || []);
        setEvents(data.events || []);
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
        <div className="reading-container">
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

  if (error && events.length === 0) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
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
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Tidslinje' }
        ]} />

        <h1>Bibelens tidslinje</h1>
        <p className={styles.intro}>
          En kronologisk oversikt over de viktigste hendelsene i Bibelen,
          fra skapelsen til den tidlige kirkens tid.
        </p>

        <TimelineView
          periods={periods}
          events={events}
        />
      </div>
    </div>
  );
}
