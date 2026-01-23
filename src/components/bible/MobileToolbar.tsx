'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToolsPanel } from './ToolsPanel';
import { TimelineMobileOverlay } from './TimelineMobileOverlay';
import { useSettings } from '@/components/SettingsContext';
import styles from './MobileToolbar.module.scss';
import type { TimelineEvent } from '@/lib/bible';

interface MobileToolbarProps {
  bookName: string;
  chapter: number;
  maxChapter: number;
  bookSlug: string;
  bookId: number;
  timelineEvents?: TimelineEvent[];
}

export function MobileToolbar({ bookName, chapter, maxChapter, bookSlug, bookId, timelineEvents = [] }: MobileToolbarProps) {
  const [showTools, setShowTools] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const bible = searchParams.get('bible');
  const bibleQuery = bible ? `?bible=${bible}` : '';

  return (
    <>
      <div className={styles.toolbar}>
        <a
          href={chapter > 1 ? `/${bookSlug}/${chapter - 1}${bibleQuery}` : undefined}
          className={`${styles.navButton} ${chapter === 1 ? styles.disabled : ''}`}
        >
          ←
        </a>

        <span className={styles.title}>
          {bookName} {chapter}
        </span>

        {settings.showTimeline && timelineEvents.length > 0 && (
          <button
            className={styles.timelineButton}
            onClick={() => setShowTimeline(true)}
            title="Tidslinje"
          >
            📅
          </button>
        )}

        <button
          className={styles.toolsButton}
          onClick={() => setShowTools(true)}
          title="Hjelpemidler"
        >
          ⚙
        </button>

        <a
          href={chapter < maxChapter ? `/${bookSlug}/${chapter + 1}${bibleQuery}` : undefined}
          className={`${styles.navButton} ${chapter === maxChapter ? styles.disabled : ''}`}
        >
          →
        </a>
      </div>

      {showTools && (
        <div className={styles.overlay} onClick={() => setShowTools(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <ToolsPanel onClose={() => setShowTools(false)} />
          </div>
        </div>
      )}

      {showTimeline && (
        <TimelineMobileOverlay
          events={timelineEvents}
          currentBookId={bookId}
          currentChapter={chapter}
          onClose={() => setShowTimeline(false)}
        />
      )}
    </>
  );
}
