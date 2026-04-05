import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/components/SettingsContext';
import { InlineRefs } from '@/components/InlineRefs';
import styles from './TimelinePanel.module.scss';
import type { TimelineEvent, TimelineReference } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface TimelinePanelProps {
  events: TimelineEvent[];
  chapterEventIds?: string[];
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

export function TimelinePanel({ events, chapterEventIds = [], currentBookId, currentChapter }: TimelinePanelProps) {
  const { settings } = useSettings();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const markerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chapterEventIdSet = useMemo(() => new Set(chapterEventIds), [chapterEventIds]);

  // Find where to place the "Du leser her" marker
  // If there are direct chapter events, no marker needed (we highlight them instead)
  // If chapterEventIds are from neighboring chapters, place marker between first and last
  const hasDirectHit = events.some(e =>
    e.references?.some(ref => ref.book_id === currentBookId && ref.chapter === currentChapter)
  );

  const markerInsertIndex = useMemo(() => {
    if (hasDirectHit || chapterEventIds.length < 2) return -1;
    // Place marker between the first and last chapter event
    const firstIdx = events.findIndex(e => chapterEventIdSet.has(e.id));
    const lastIdx = events.findLastIndex(e => chapterEventIdSet.has(e.id));
    if (firstIdx === -1 || firstIdx === lastIdx) return -1;
    // Place after the first match
    return firstIdx;
  }, [events, chapterEventIds, chapterEventIdSet, hasDirectHit]);

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
  };

  // Auto-scroll to current event or marker when chapter changes
  useEffect(() => {
    if (!settings.showTimeline || !containerRef.current || events.length === 0) return;

    // Small delay to ensure refs are set after render
    setTimeout(() => {
      let element: HTMLElement | null = null;

      if (markerRef.current) {
        element = markerRef.current;
      } else if (chapterEventIds.length > 0) {
        element = eventRefs.current.get(chapterEventIds[0]) || null;
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
  }, [currentBookId, currentChapter, chapterEventIds, events, settings.showTimeline]);

  // Hide in reading mode
  if (settings.layoutMode === 'reading' || !settings.showTimeline) {
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
        {events.map((event, index) => {
          const isExpanded = expandedEvent === event.id;
          const isCurrentChapter = chapterEventIdSet.has(event.id);

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
                        <p className={styles.eventDescription}><InlineRefs>{event.description}</InlineRefs></p>
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
