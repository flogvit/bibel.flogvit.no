import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './MultiTimelineView.module.scss';
import type {
  TimelinePeriod,
  TimelineEvent,
  TimelineReference,
  TimelineBookSection,
  MultiTimelineData,
  VerseWithOriginal,
  VerseRef,
} from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import { useSettings } from '@/components/SettingsContext';
import { VerseDisplay } from './bible/VerseDisplay';
import { ItemTagging } from './ItemTagging';

function formatReference(ref: TimelineReference): string {
  const verseRange = ref.verse_start === ref.verse_end
    ? `${ref.verse_start}`
    : `${ref.verse_start}-${ref.verse_end}`;
  return `${ref.book_short_name} ${ref.chapter}:${verseRange}`;
}

function getReferenceUrl(ref: TimelineReference): string {
  return `/${toUrlSlug(ref.book_short_name || '')}/${ref.chapter}#v${ref.verse_start}`;
}

function toVerseRefs(refs: TimelineReference[]): VerseRef[] {
  return refs.map(ref => {
    const verses: number[] = [];
    for (let v = ref.verse_start; v <= ref.verse_end; v++) {
      verses.push(v);
    }
    return { bookId: ref.book_id, chapter: ref.chapter, verses };
  });
}

interface EventCardProps {
  event: TimelineEvent;
  compact?: boolean;
  showRegion?: boolean;
  bible?: string;
}

function EventCard({ event, compact, showRegion, bible }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showVerses, setShowVerses] = useState(false);
  const [loadedVerses, setLoadedVerses] = useState<VerseWithOriginal[] | null>(null);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const handleToggleVerses = async () => {
    setShowVerses(prev => !prev);
    if (loadedVerses || !event.references?.length) return;

    setLoadingVerses(true);
    try {
      const refs = toVerseRefs(event.references);
      const response = await fetch('/api/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs, bible }),
      });
      if (!response.ok) throw new Error('Failed to fetch verses');
      const verses: VerseWithOriginal[] = await response.json();
      setLoadedVerses(verses);
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoadingVerses(false);
    }
  };

  return (
    <div
      className={`${styles.eventCard} ${event.importance === 'major' ? styles.majorEvent : ''} ${expanded ? styles.expanded : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.eventCardHeader}>
        {event.year_display && (
          <span className={styles.eventYear}>{event.year_display}</span>
        )}
        <h4 className={styles.eventTitle}>{event.title}</h4>
        {showRegion && event.region && (
          <span className={styles.eventRegion}>{event.region}</span>
        )}
      </div>

      {(expanded || (!compact && event.importance === 'major')) && event.description && (
        <p className={styles.eventDescription}>{event.description}</p>
      )}

      {expanded && (
        <div className={styles.taggingSection} onClick={(e) => e.stopPropagation()}>
          <ItemTagging itemType="timeline" itemId={event.id} />
        </div>
      )}

      {expanded && event.references && event.references.length > 0 && (
        <div className={styles.eventReferences} onClick={(e) => e.stopPropagation()}>
          <div className={styles.referencesHeader}>
            <strong>Bibelhenvisninger:</strong>
            <button className={styles.showVersesButton} onClick={handleToggleVerses}>
              {showVerses ? 'Skjul vers' : 'Vis vers'}
            </button>
          </div>
          <div className={styles.referenceLinks}>
            {event.references.map((ref, i) => (
              <Link key={i} to={getReferenceUrl(ref)} className={styles.referenceLink}>
                {formatReference(ref)}
              </Link>
            ))}
          </div>

          {loadingVerses && (
            <p className={styles.loadingVerses}>Laster bibelvers...</p>
          )}

          {showVerses && loadedVerses && (
            <div className={styles.inlineVerses}>
              {loadedVerses.map((verseData, vi) => (
                <div key={vi} className={styles.verseGroup}>
                  <div className={styles.verseHeader}>
                    <Link
                      to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                      className={styles.verseRef}
                    >
                      {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                    </Link>
                  </div>
                  <VerseDisplay
                    verse={verseData.verse}
                    bookId={verseData.verse.book_id}
                    originalText={verseData.originalText || undefined}
                    originalLanguage={verseData.originalLanguage}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!expanded && !compact && event.importance !== 'major' && (
        <span className={styles.expandHint}>Klikk for detaljer</span>
      )}
    </div>
  );
}

interface MultiTimelineViewProps {
  data: MultiTimelineData;
}

export function MultiTimelineView({ data }: MultiTimelineViewProps) {
  const { settings } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(
    data.books.available.length > 0 ? data.books.available[0].id : null
  );
  const [activeTab, setActiveTab] = useState<'bible' | 'world' | 'books'>('bible');

  // Group bible events by period
  const bibleByPeriod = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of data.bible.events) {
      const pid = event.period_id || '__none__';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(event);
    }
    return map;
  }, [data.bible.events]);

  // Group world events by period
  const worldByPeriod = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of data.world.events) {
      const pid = event.period_id || '__none__';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(event);
    }
    return map;
  }, [data.world.events]);

  // Map book_id → set of period_ids, based on which bible events reference that book
  const bookToPeriods = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const event of data.bible.events) {
      if (!event.period_id || !event.references) continue;
      for (const ref of event.references) {
        if (!map.has(ref.book_id)) map.set(ref.book_id, new Set());
        map.get(ref.book_id)!.add(event.period_id);
      }
    }
    return map;
  }, [data.bible.events]);

  // Book events and sections for selected book, grouped by period
  const bookEventsByPeriod = useMemo(() => {
    if (!selectedBookId) return new Map<string, { sections: TimelineBookSection[]; events: TimelineEvent[] }>();

    const bookSections = data.books.sections
      .filter(s => s.book_id === selectedBookId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const bookEvents = data.books.events.filter(e => e.book_id === selectedBookId);

    // Which periods does this book belong to?
    const periodIds = bookToPeriods.get(selectedBookId);
    if (!periodIds || periodIds.size === 0) {
      // No mapping found - put all events in first period as fallback
      const firstPeriod = data.bible.periods[0]?.id || '__none__';
      const result = new Map<string, { sections: TimelineBookSection[]; events: TimelineEvent[] }>();
      result.set(firstPeriod, { sections: bookSections, events: bookEvents });
      return result;
    }

    // Distribute sections and events across periods
    // Strategy: assign each section to the period that bible events reference most
    // from that section's chapter range
    const result = new Map<string, { sections: TimelineBookSection[]; events: TimelineEvent[] }>();

    // Initialize all relevant periods
    for (const pid of periodIds) {
      result.set(pid, { sections: [], events: [] });
    }

    // For each section, find which period references chapters in its range most
    const periodIdsArray = Array.from(periodIds);
    for (const section of bookSections) {
      let bestPeriod = periodIdsArray[0];
      let bestCount = 0;

      for (const pid of periodIdsArray) {
        const bibleEvents = bibleByPeriod.get(pid) || [];
        let count = 0;
        for (const event of bibleEvents) {
          if (!event.references) continue;
          for (const ref of event.references) {
            if (ref.book_id === selectedBookId && ref.chapter >= section.chapter_start && ref.chapter <= section.chapter_end) {
              count++;
            }
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestPeriod = pid;
        }
      }

      if (!result.has(bestPeriod)) {
        result.set(bestPeriod, { sections: [], events: [] });
      }
      result.get(bestPeriod)!.sections.push(section);
    }

    // Assign each book event to the period that its section belongs to
    const sectionToPeriod = new Map<string, string>();
    for (const [pid, data] of result) {
      for (const section of data.sections) {
        sectionToPeriod.set(section.id, pid);
      }
    }

    for (const event of bookEvents) {
      const pid = (event.section_id && sectionToPeriod.get(event.section_id)) || periodIdsArray[0];
      if (!result.has(pid)) {
        result.set(pid, { sections: [], events: [] });
      }
      result.get(pid)!.events.push(event);
    }

    return result;
  }, [data, selectedBookId, bookToPeriods, bibleByPeriod]);

  // Use bible periods as master list
  const periods = data.bible.periods;

  const filteredPeriods = selectedPeriod
    ? periods.filter(p => p.id === selectedPeriod)
    : periods;

  return (
    <div className={styles.container}>
      {/* Period filter buttons */}
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
            style={{ '--period-color': period.color || '#8b7355' } as React.CSSProperties}
          >
            {period.name}
          </button>
        ))}
      </div>

      {/* Mobile tabs */}
      <div className={styles.mobileTabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'bible' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('bible')}
        >
          Bibelen
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'world' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('world')}
        >
          Verden
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'books' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('books')}
        >
          Bok
        </button>
      </div>

      {/* Column headers */}
      <div className={styles.columnHeaders}>
        <div className={`${styles.colHeader} ${activeTab === 'world' ? styles.activeColumn : ''}`}>
          Verden
        </div>
        <div className={`${styles.colHeader} ${activeTab === 'bible' ? styles.activeColumn : ''}`}>
          Bibelen
        </div>
        <div className={`${styles.colHeader} ${styles.bookColHeader} ${activeTab === 'books' ? styles.activeColumn : ''}`}>
          <span>Bok</span>
          <select
            value={selectedBookId ?? ''}
            onChange={(e) => setSelectedBookId(e.target.value ? Number(e.target.value) : null)}
            className={styles.bookSelect}
            onClick={(e) => e.stopPropagation()}
          >
            {data.books.available.map(book => (
              <option key={book.id} value={book.id}>
                {book.name_no}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period rows */}
      {filteredPeriods.map(period => {
        const worldPeriod = data.world.periods.find(wp => wp.id === period.id);
        const worldEvents = worldByPeriod.get(period.id) || [];
        const bibleEvents = bibleByPeriod.get(period.id) || [];
        const bookData = bookEventsByPeriod.get(period.id);

        const worldDisplay = selectedPeriod ? worldEvents : worldEvents.filter(e => e.importance === 'major');
        const bibleDisplay = selectedPeriod ? bibleEvents : bibleEvents.filter(e => e.importance === 'major');

        return (
          <div
            key={period.id}
            className={styles.periodRow}
            style={{ '--period-color': period.color || '#8b7355' } as React.CSSProperties}
          >
            {/* Period title spanning all columns */}
            <div className={styles.periodBanner}>
              <h2>{period.name}</h2>
              {period.description && <p>{period.description}</p>}
            </div>

            {/* Three cells */}
            <div className={styles.periodCells}>
              {/* World cell */}
              <div className={`${styles.cell} ${activeTab === 'world' ? styles.activeColumn : ''}`}>
                {worldPeriod && worldPeriod.name !== period.name && (
                  <div className={styles.cellSubtitle}>{worldPeriod.name}</div>
                )}
                {worldPeriod?.description && (
                  <p className={styles.cellDescription}>{worldPeriod.description}</p>
                )}
                <div className={styles.eventList}>
                  {worldDisplay.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact={!selectedPeriod}
                      showRegion
                      bible={settings.bible}
                    />
                  ))}
                  {worldDisplay.length === 0 && (
                    <p className={styles.noEvents}>Ingen hendelser</p>
                  )}
                </div>
              </div>

              {/* Bible cell */}
              <div className={`${styles.cell} ${activeTab === 'bible' ? styles.activeColumn : ''}`}>
                <div className={styles.eventList}>
                  {bibleDisplay.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact={!selectedPeriod}
                      bible={settings.bible}
                    />
                  ))}
                  {bibleDisplay.length === 0 && (
                    <p className={styles.noEvents}>Ingen hendelser</p>
                  )}
                </div>
              </div>

              {/* Book cell */}
              <div className={`${styles.cell} ${activeTab === 'books' ? styles.activeColumn : ''}`}>
                {bookData && (bookData.sections.length > 0 || bookData.events.length > 0) ? (
                  <>
                    {bookData.sections.map(section => {
                      const sectionEvents = bookData.events.filter(e => e.section_id === section.id);
                      return (
                        <div key={section.id} className={styles.bookSection}>
                          <div className={styles.sectionHeader}>
                            <h3>{section.title}</h3>
                            <span className={styles.sectionChapters}>
                              Kap. {section.chapter_start}–{section.chapter_end}
                            </span>
                            {section.description && <p>{section.description}</p>}
                          </div>
                          <div className={styles.eventList}>
                            {sectionEvents.map(event => (
                              <EventCard key={event.id} event={event} compact bible={settings.bible} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {/* Events without a section */}
                    {bookData.events.filter(e => !e.section_id || !bookData.sections.find(s => s.id === e.section_id)).length > 0 && (
                      <div className={styles.eventList}>
                        {bookData.events
                          .filter(e => !e.section_id || !bookData.sections.find(s => s.id === e.section_id))
                          .map(event => (
                            <EventCard key={event.id} event={event} compact bible={settings.bible} />
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className={styles.noEvents}>—</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
