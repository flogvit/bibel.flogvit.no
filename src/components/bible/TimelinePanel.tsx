import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/components/SettingsContext';
import styles from './TimelinePanel.module.scss';
import type { TimelineEvent, TimelineReference } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface TimelinePanelProps {
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

// Estimate a timeline position (sort_order) for a given book/chapter
// This maps Bible books to their approximate chronological position
function getChapterSortOrder(bookId: number, chapter: number): number {
  // NT books need special handling - they're not in chronological order
  if (bookId >= 40) {
    // Gospels (Matt, Mark, Luke, John) - map to Jesus' ministry timeline
    if (bookId >= 40 && bookId <= 43) {
      // Map chapters to Jesus' life (sort_order 120-142)
      // Early chapters = birth/early ministry, later chapters = death/resurrection
      const gospel = bookId - 40; // 0-3
      const maxChapters = [28, 16, 24, 21][gospel]; // chapters in each gospel
      const progress = chapter / maxChapters;
      return 120 + Math.floor(progress * 22); // 120-142
    }
    // Acts - early church history (sort_order 150-160)
    if (bookId === 44) {
      return 150 + Math.floor((chapter / 28) * 10);
    }
    // Epistles and Revelation - map to their actual early church timeline positions
    const epistleSortOrders: Record<number, number> = {
      45: 209,  // Romans
      46: 208,  // 1 Corinthians
      47: 208,  // 2 Corinthians
      48: 206,  // Galatians
      49: 204,  // Ephesians (prison epistle)
      50: 204,  // Philippians (prison epistle)
      51: 204,  // Colossians (prison epistle)
      52: 207,  // 1 Thessalonians
      53: 207,  // 2 Thessalonians
      54: 212,  // 1 Timothy (pastoral)
      55: 212,  // 2 Timothy (pastoral)
      56: 212,  // Titus (pastoral)
      57: 204,  // Philemon (prison epistle)
      58: 210,  // Hebrews
      59: 205,  // James
      60: 211,  // 1 Peter
      61: 211,  // 2 Peter
      62: 214,  // 1 John
      63: 214,  // 2 John
      64: 214,  // 3 John
      65: 213,  // Jude
      66: 216,  // Revelation
    };
    return epistleSortOrders[bookId] ?? 204;
  }

  // OT books - use existing book_id based approach but scale to match sort_order
  // GT spans sort_order 1-110 approximately
  // Books 1-39 map to periods from creation to return
  return Math.floor((bookId * 1000 + chapter) / 400); // Scale down to match timeline
}

// Find the index where to insert "You are here" marker
// Returns -1 if there's a current chapter match, or the index to insert after
function findMarkerInsertIndex(
  events: TimelineEvent[],
  currentBookId: number,
  currentChapter: number
): number {
  // Check if any event matches the current chapter
  const hasCurrentChapterEvent = events.some(e =>
    e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
  );

  if (hasCurrentChapterEvent) {
    return -1; // No marker needed
  }

  const currentSortOrder = getChapterSortOrder(currentBookId, currentChapter);

  // Find the last event that comes before the current position
  // Events are already sorted by sort_order
  let insertAfterIndex = -1;

  for (let i = 0; i < events.length; i++) {
    if (events[i].sort_order < currentSortOrder) {
      insertAfterIndex = i;
    } else {
      break;
    }
  }

  return insertAfterIndex;
}

// Find nearest event based on sort_order position
function findNearestEvent(
  events: TimelineEvent[],
  currentBookId: number,
  currentChapter: number
): TimelineEvent | null {
  if (events.length === 0) return null;

  const currentSortOrder = getChapterSortOrder(currentBookId, currentChapter);

  let nearestEvent: TimelineEvent | null = null;
  let smallestDistance = Infinity;

  for (const event of events) {
    const distance = Math.abs(event.sort_order - currentSortOrder);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearestEvent = event;
    }
  }

  return nearestEvent;
}

export function TimelinePanel({ events, currentBookId, currentChapter }: TimelinePanelProps) {
  const { settings } = useSettings();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const markerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate where to insert the "You are here" marker
  const markerInsertIndex = useMemo(
    () => findMarkerInsertIndex(events, currentBookId, currentChapter),
    [events, currentBookId, currentChapter]
  );

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
  };

  // Auto-scroll to current event or marker when chapter changes
  useEffect(() => {
    if (!settings.showTimeline || !containerRef.current || events.length === 0) return;

    // Find events for current chapter
    const currentEvents = events.filter(e =>
      e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
    );

    // Small delay to ensure refs are set after render
    setTimeout(() => {
      let element: HTMLElement | null = null;

      if (currentEvents.length > 0) {
        // Scroll to the first matching event
        element = eventRefs.current.get(currentEvents[0].id) || null;
      } else if (markerRef.current) {
        // Scroll to the "You are here" marker
        element = markerRef.current;
      } else {
        // Fallback to nearest event
        const nearestEvent = findNearestEvent(events, currentBookId, currentChapter);
        if (nearestEvent) {
          element = eventRefs.current.get(nearestEvent.id) || null;
        }
      }

      if (element && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const targetScroll = containerRef.current.scrollTop + elementRect.top - containerRect.top - 100;

        containerRef.current.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [currentBookId, currentChapter, events, settings.showTimeline]);

  // Hide in reading mode
  if (settings.readingMode || !settings.showTimeline) {
    return null;
  }

  // Render the "You are here" marker
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
    <div className={styles.panel} ref={setContainerRef}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tidslinje</h2>
        <Link to="/tidslinje" className={styles.viewAllLink}>
          Se alt →
        </Link>
      </div>

      <div className={styles.timeline}>
        {/* If marker should be before all events */}
        {markerInsertIndex === -1 && events.length > 0 && !events.some(e =>
          e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
        ) && events[0].sort_order > getChapterSortOrder(currentBookId, currentChapter) && renderMarker()}

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
                  <h3 className={styles.eventTitle}>{event.title}</h3>

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
                                onClick={(e) => e.stopPropagation()}
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

              {/* Insert marker after this event if needed */}
              {markerInsertIndex === index && renderMarker()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
