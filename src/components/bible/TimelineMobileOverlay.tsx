import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './TimelineMobileOverlay.module.scss';
import type { TimelineEvent, TimelineReference } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface TimelineMobileOverlayProps {
  events: TimelineEvent[];
  currentBookId: number;
  currentChapter: number;
  onClose: () => void;
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

// Get the minimum position for an event based on its references
function getEventPosition(event: TimelineEvent): number {
  if (!event.references || event.references.length === 0) return Infinity;
  return Math.min(...event.references.map(ref => ref.book_id * 1000 + ref.chapter));
}

// Find the index where to insert "You are here" marker
function findMarkerInsertIndex(
  events: TimelineEvent[],
  currentBookId: number,
  currentChapter: number
): number {
  const currentPosition = currentBookId * 1000 + currentChapter;

  const hasCurrentChapterEvent = events.some(e =>
    e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
  );

  if (hasCurrentChapterEvent) {
    return -1;
  }

  let insertAfterIndex = -1;

  for (let i = 0; i < events.length; i++) {
    const eventPos = getEventPosition(events[i]);
    if (eventPos < currentPosition) {
      insertAfterIndex = i;
    } else {
      break;
    }
  }

  return insertAfterIndex;
}

export function TimelineMobileOverlay({ events, currentBookId, currentChapter, onClose }: TimelineMobileOverlayProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const markerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const markerInsertIndex = findMarkerInsertIndex(events, currentBookId, currentChapter);

  // Auto-scroll to current position on open
  useEffect(() => {
    const currentEvents = events.filter(e =>
      e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
    );

    setTimeout(() => {
      let element: HTMLElement | null = null;

      if (currentEvents.length > 0) {
        element = eventRefs.current.get(currentEvents[0].id) || null;
      } else if (markerRef.current) {
        element = markerRef.current;
      }

      if (element && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop + elementRect.top - containerRect.top - 120;

        containerRef.current.scrollTo({
          top: scrollTop,
          behavior: 'instant'
        });
      }
    }, 50);
  }, [currentBookId, currentChapter, events]);

  const renderMarker = () => (
    <div
      key="current-position-marker"
      ref={markerRef}
      className={styles.positionMarker}
    >
      <div className={styles.markerLine}>
        <div className={styles.markerDot} />
      </div>
      <div className={styles.markerContent}>
        <span className={styles.markerLabel}>Du leser her</span>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Lukk tidslinje">
          ← Tilbake
        </button>
        <h2 className={styles.title}>Tidslinje</h2>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.content} ref={containerRef}>
        <div className={styles.timeline}>
          {/* If marker should be before all events */}
          {markerInsertIndex === -1 && events.length > 0 && !events.some(e =>
            e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
          ) && getEventPosition(events[0]) > currentBookId * 1000 + currentChapter && renderMarker()}

          {events.map((event, index) => {
            const isExpanded = expandedEvent === event.id;
            const isCurrentChapter = event.references?.some(
              ref => ref.book_id === currentBookId && ref.chapter === currentChapter
            );

            return (
              <div key={event.id}>
                <div
                  ref={(el) => {
                    if (el) eventRefs.current.set(event.id, el);
                  }}
                  className={`${styles.event} ${isCurrentChapter ? styles.currentChapter : ''} ${isExpanded ? styles.expanded : ''}`}
                  style={{ '--period-color': event.period?.color || '#8b7355' } as React.CSSProperties}
                >
                  <div className={styles.eventLine}>
                    <div className={styles.eventDot} />
                  </div>

                  <div
                    className={styles.eventContent}
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <span className={styles.eventYear}>{event.year_display}</span>
                    <h4 className={styles.eventTitle}>{event.title}</h4>

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
                                  to={getReferenceUrl(ref)}
                                  className={`${styles.referenceLink} ${isCurrent ? styles.currentRef : ''}`}
                                  onClick={onClose}
                                >
                                  {formatReference(ref)}
                                  {isCurrent && <span className={styles.hereMarker}>←</span>}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {markerInsertIndex === index && renderMarker()}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <Link to="/tidslinje" className={styles.viewAllLink} onClick={onClose}>
            Se fullstendig tidslinje →
          </Link>
        </div>
      </div>
    </div>
  );
}
