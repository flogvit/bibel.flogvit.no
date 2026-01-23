'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VerseDisplay } from './bible/VerseDisplay';
import type { PersonKeyEvent, PersonVerseRef } from '@/lib/bible';
import type { VerseWithOriginal } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import styles from '@/app/personer/[person]/page.module.scss';

interface PersonVerseDisplayProps {
  keyEvents: PersonKeyEvent[];
}

interface EventWithVerses extends PersonKeyEvent {
  loadedVerses: VerseWithOriginal[];
}

export function PersonVerseDisplay({ keyEvents }: PersonVerseDisplayProps) {
  const [events, setEvents] = useState<EventWithVerses[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerses() {
      // Collect all verse references from all events
      const allRefs: PersonVerseRef[] = [];
      for (const event of keyEvents) {
        allRefs.push(...event.verses);
      }

      try {
        const response = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs: allRefs }),
        });

        if (!response.ok) throw new Error('Failed to fetch verses');

        const verses: VerseWithOriginal[] = await response.json();

        // Distribute verses back to events
        let verseIndex = 0;
        const loadedEvents: EventWithVerses[] = keyEvents.map(event => {
          const eventVerses: VerseWithOriginal[] = [];

          for (const ref of event.verses) {
            const count = ref.verses?.length || (ref.verse ? 1 : 0);
            for (let i = 0; i < count; i++) {
              if (verseIndex < verses.length) {
                eventVerses.push(verses[verseIndex]);
                verseIndex++;
              }
            }
          }

          return {
            ...event,
            loadedVerses: eventVerses,
          };
        });

        setEvents(loadedEvents);
      } catch (error) {
        console.error('Error loading verses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [keyEvents]);

  if (loading) {
    return <p>Laster bibelvers...</p>;
  }

  return (
    <div className={styles.eventList}>
      {events.map((event, eventIndex) => (
        <div key={eventIndex} className={styles.event}>
          <div className={styles.eventHeader}>
            <h3>{event.title}</h3>
          </div>
          <p className={styles.eventDescription}>{event.description}</p>

          {event.loadedVerses.map((verseData, verseIndex) => (
            <div key={verseIndex} className={styles.verseGroup}>
              <div className={styles.verseHeader}>
                <Link
                  href={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                  className={styles.verseRef}
                >
                  {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                </Link>
                <Link
                  href={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                  className={styles.openContext}
                >
                  Vis i kontekst →
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
      ))}
    </div>
  );
}
