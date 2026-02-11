import { useState } from 'react';
import type { ChapterContextData } from './ChapterContextPanel';
import styles from './TimelineContextPanel.module.scss';

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  year_display: string | null;
  period_name: string | null;
  period_color: string | null;
  // Added for display context
  bookName: string;
  chapter: number;
}

interface TimelineContextPanelProps {
  contextData: ChapterContextData[];
}

export function TimelineContextPanel({ contextData }: TimelineContextPanelProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Collect all timeline events with their source context
  const events: TimelineEvent[] = [];
  const seenIds = new Set<string>();

  for (const ch of contextData) {
    for (const ev of ch.timelineEvents) {
      if (!seenIds.has(ev.id)) {
        seenIds.add(ev.id);
        events.push({
          ...ev,
          bookName: ch.bookName ?? `Bok ${ch.bookId}`,
          chapter: ch.chapter,
        });
      }
    }
  }

  if (events.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.empty}>
          {contextData.length === 0
            ? 'Legg til versreferanser i teksten for å se tidslinje her.'
            : 'Ingen tidslinjehendelser funnet for de refererte kapitlene.'}
        </p>
      </div>
    );
  }

  // Group by period
  const grouped = new Map<string, { name: string; color: string | null; events: TimelineEvent[] }>();
  for (const ev of events) {
    const periodKey = ev.period_name ?? 'Ukjent periode';
    const existing = grouped.get(periodKey);
    if (existing) {
      existing.events.push(ev);
    } else {
      grouped.set(periodKey, {
        name: periodKey,
        color: ev.period_color,
        events: [ev],
      });
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.timeline}>
        {[...grouped.entries()].map(([key, group]) => (
          <div key={key} className={styles.periodGroup}>
            <div
              className={styles.periodName}
              style={{ '--period-color': group.color || '#8b7355' } as React.CSSProperties}
            >
              {group.name}
            </div>

            {group.events.map(ev => {
              const isExpanded = expandedEvent === ev.id;

              return (
                <div
                  key={ev.id}
                  className={`${styles.event} ${isExpanded ? styles.expanded : ''}`}
                  style={{ '--period-color': group.color || '#8b7355' } as React.CSSProperties}
                  onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                >
                  <div className={styles.eventLine}>
                    <div className={styles.eventDot} />
                  </div>
                  <div className={styles.eventContent}>
                    {ev.year_display && (
                      <span className={styles.eventYear}>{ev.year_display}</span>
                    )}
                    <h4 className={styles.eventTitle}>{ev.title}</h4>
                    <span className={styles.eventSource}>
                      {ev.bookName} {ev.chapter}
                    </span>

                    {isExpanded && ev.description && (
                      <p className={styles.eventDescription}>{ev.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
