import styles from './page.module.scss';
import { getFullTimeline } from '@/lib/bible';
import { TimelineView } from '@/components/TimelineView';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Tidslinje - Bibelen',
  description: 'Tidslinje over viktige hendelser i Bibelen fra skapelsen til den tidlige kirken',
};

export default function TimelinePage() {
  const timeline = getFullTimeline();

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
          periods={timeline.periods}
          events={timeline.events}
        />
      </div>
    </div>
  );
}
