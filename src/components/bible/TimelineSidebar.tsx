import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/components/SettingsContext';
import styles from './TimelineSidebar.module.scss';
import type { TimelineEvent, TimelineReference } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface TimelineSidebarProps {
  events: TimelineEvent[];
  currentBookId: number;
  currentChapter: number;
}

function formatReference(ref: TimelineReference): string {
  const verseRange = ref.verse_start === ref.verse_end
    ? `${ref.verse_start}`
    : `${ref.verse_start}-${ref.verse_end}`;
  return `${ref.book_short_name} ${ref.chapter}:${verseRange}`;
}

function getReferenceUrl(ref: TimelineReference): string {
  return `/${toUrlSlug(ref.book_short_name || '')}/${ref.chapter}#v${ref.verse_start}`;
}

export function TimelineSidebar({ events, currentBookId, currentChapter }: TimelineSidebarProps) {
  const { settings } = useSettings();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  if (!settings.showTimeline) {
    return null;
  }

  if (events.length === 0) {
    return (
      <div className={styles.sidebar}>
        <h3 className={styles.title}>Tidslinje</h3>
        <p className={styles.empty}>
          Ingen hendelser i tidslinjen for dette kapitlet.
        </p>
        <Link to="/tidslinje" className={styles.viewAllLink}>
          Se hele tidslinjen →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tidslinje</h3>
        <Link to="/tidslinje" className={styles.viewAllLink}>
          Se alt →
        </Link>
      </div>

      <div className={styles.events}>
        {events.map(event => {
          const isExpanded = expandedEvent === event.id;
          const isCurrentChapter = event.references?.some(
            ref => ref.book_id === currentBookId && ref.chapter === currentChapter
          );

          return (
            <div
              key={event.id}
              className={`${styles.event} ${isCurrentChapter ? styles.currentChapter : ''} ${isExpanded ? styles.expanded : ''}`}
              style={{ '--period-color': event.period?.color || '#8b7355' } as React.CSSProperties}
            >
              <div
                className={styles.eventHeader}
                onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
              >
                <div className={styles.eventDot} />
                <div className={styles.eventInfo}>
                  <span className={styles.eventYear}>{event.year_display}</span>
                  <h4 className={styles.eventTitle}>{event.title}</h4>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.eventDetails}>
                  {event.description && (
                    <p className={styles.eventDescription}>{event.description}</p>
                  )}

                  {event.references && event.references.length > 0 && (
                    <div className={styles.eventReferences}>
                      {event.references.map((ref, i) => {
                        const isCurrent = ref.book_id === currentBookId && ref.chapter === currentChapter;
                        return (
                          <Link
                            key={i}
                            href={getReferenceUrl(ref)}
                            className={`${styles.referenceLink} ${isCurrent ? styles.currentRef : ''}`}
                          >
                            {formatReference(ref)}
                            {isCurrent && <span className={styles.hereMarker}>← Du er her</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
