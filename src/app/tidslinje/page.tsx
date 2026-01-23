import styles from './page.module.scss';
import Link from 'next/link';
import { getFullTimeline } from '@/lib/bible';
import { TimelineView } from '@/components/TimelineView';

export const metadata = {
  title: 'Tidslinje - Bibelen',
  description: 'Tidslinje over viktige hendelser i Bibelen fra skapelsen til den tidlige kirken',
};

export default function TimelinePage() {
  const timeline = getFullTimeline();

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/" className={styles.backLink}>← Tilbake til Bibelen</Link>

        <h1>Bibelens tidslinje</h1>
        <p className={styles.intro}>
          En kronologisk oversikt over de viktigste hendelsene i Bibelen,
          fra skapelsen til den tidlige kirkens tid.
        </p>

        <TimelineView
          periods={timeline.periods}
          events={timeline.events}
        />
      </div>
    </main>
  );
}
