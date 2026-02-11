import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './TimelineView.module.scss';
import type { TimelinePeriod, TimelineEvent, TimelineReference, VerseWithOriginal, VerseRef } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import { useSettings } from '@/components/SettingsContext';
import { VerseDisplay } from './bible/VerseDisplay';
import { ItemTagging } from './ItemTagging';

interface TimelineViewProps {
  periods: TimelinePeriod[];
  events: TimelineEvent[];
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

// Convert timeline reference to VerseRef format for API
function toVerseRefs(refs: TimelineReference[]): VerseRef[] {
  return refs.map(ref => {
    const verses: number[] = [];
    for (let v = ref.verse_start; v <= ref.verse_end; v++) {
      verses.push(v);
    }
    return {
      bookId: ref.book_id,
      chapter: ref.chapter,
      verses,
    };
  });
}

interface LoadedVerses {
  [eventId: string]: VerseWithOriginal[];
}

export function TimelineView({ periods, events }: TimelineViewProps) {
  const { settings } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showVerses, setShowVerses] = useState<{ [eventId: string]: boolean }>({});
  const [loadedVerses, setLoadedVerses] = useState<LoadedVerses>({});
  const [loadingVerses, setLoadingVerses] = useState<{ [eventId: string]: boolean }>({});

  const filteredEvents = selectedPeriod
    ? events.filter(e => e.period_id === selectedPeriod)
    : events;

  const majorEvents = filteredEvents.filter(e => e.importance === 'major');
  const showingMajorOnly = !selectedPeriod;

  const displayEvents = showingMajorOnly ? majorEvents : filteredEvents;

  const handleToggleVerses = async (event: TimelineEvent) => {
    const eventId = event.id;

    // Toggle visibility
    setShowVerses(prev => ({ ...prev, [eventId]: !prev[eventId] }));

    // If already loaded or no references, no need to fetch
    if (loadedVerses[eventId] || !event.references?.length) {
      return;
    }

    // Start loading
    setLoadingVerses(prev => ({ ...prev, [eventId]: true }));

    try {
      const refs = toVerseRefs(event.references);
      const response = await fetch('/api/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs, bible: settings.bible }),
      });

      if (!response.ok) throw new Error('Failed to fetch verses');

      const verses: VerseWithOriginal[] = await response.json();
      setLoadedVerses(prev => ({ ...prev, [eventId]: verses }));
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoadingVerses(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className={styles.container}>
      {/* Period filter */}
      <div className={styles.periodFilter}>
        <button
          className={`${styles.periodButton} ${!selectedPeriod ? styles.active : ''}`}
          onClick={() => setSelectedPeriod(null)}
        >
          Alle perioder
        </button>
        {periods.map(period => (
          <button
            key={period.id}
            className={`${styles.periodButton} ${selectedPeriod === period.id ? styles.active : ''}`}
            onClick={() => setSelectedPeriod(period.id)}
            style={{
              '--period-color': period.color || '#8b7355'
            } as React.CSSProperties}
          >
            {period.name}
          </button>
        ))}
      </div>

      {showingMajorOnly && (
        <p className={styles.filterInfo}>
          Viser {majorEvents.length} store hendelser. Velg en periode for å se alle hendelser.
        </p>
      )}

      {/* Timeline */}
      <div className={styles.timeline}>
        {displayEvents.map((event, index) => {
          const isExpanded = expandedEvent === event.id;
          const prevEvent = displayEvents[index - 1];
          const showPeriodHeader = !prevEvent || prevEvent.period_id !== event.period_id;
          const period = periods.find(p => p.id === event.period_id);
          const eventVerses = loadedVerses[event.id];
          const isShowingVerses = showVerses[event.id];
          const isLoadingVerses = loadingVerses[event.id];

          return (
            <div key={event.id}>
              {showPeriodHeader && period && (
                <div
                  className={styles.periodHeader}
                  style={{ '--period-color': period.color || '#8b7355' } as React.CSSProperties}
                >
                  <h2>{period.name}</h2>
                  {period.description && <p>{period.description}</p>}
                </div>
              )}

              <div
                className={`${styles.event} ${event.importance === 'major' ? styles.majorEvent : ''} ${isExpanded ? styles.expanded : ''}`}
                style={{ '--period-color': period?.color || '#8b7355' } as React.CSSProperties}
              >
                <div className={styles.eventMarker}>
                  <div className={styles.eventDot} />
                  <div className={styles.eventLine} />
                </div>

                <div
                  className={styles.eventContent}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  <div className={styles.eventHeader}>
                    <span className={styles.eventYear}>{event.year_display || ''}</span>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                  </div>

                  {(isExpanded || event.importance === 'major') && event.description && (
                    <p className={styles.eventDescription}>{event.description}</p>
                  )}

                  {isExpanded && (
                    <div className={styles.taggingSection} onClick={(e) => e.stopPropagation()}>
                      <ItemTagging itemType="timeline" itemId={event.id} />
                    </div>
                  )}

                  {isExpanded && event.references && event.references.length > 0 && (
                    <div className={styles.eventReferences}>
                      <div className={styles.referencesHeader}>
                        <strong>Bibelhenvisninger:</strong>
                        <button
                          className={styles.showVersesButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVerses(event);
                          }}
                        >
                          {isShowingVerses ? 'Skjul bibelvers' : 'Vis bibelvers'}
                        </button>
                      </div>
                      <div className={styles.referenceLinks}>
                        {event.references.map((ref, i) => (
                          <Link
                            key={i}
                            to={getReferenceUrl(ref)}
                            className={styles.referenceLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {formatReference(ref)}
                          </Link>
                        ))}
                      </div>

                      {isLoadingVerses && (
                        <p className={styles.loadingVerses}>Laster bibelvers...</p>
                      )}

                      {isShowingVerses && eventVerses && (
                        <div className={styles.inlineVerses}>
                          {eventVerses.map((verseData, verseIndex) => (
                            <div key={verseIndex} className={styles.verseGroup}>
                              <div className={styles.verseHeader}>
                                <Link
                                  to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                                  className={styles.verseRef}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                                </Link>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <VerseDisplay
                                  verse={verseData.verse}
                                  bookId={verseData.verse.book_id}
                                  originalText={verseData.originalText || undefined}
                                  originalLanguage={verseData.originalLanguage}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!isExpanded && event.importance !== 'major' && (
                    <span className={styles.expandHint}>Klikk for mer info</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
