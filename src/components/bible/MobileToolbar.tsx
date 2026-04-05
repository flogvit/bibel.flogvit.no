import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolsPanel } from './ToolsPanel';
import { MobileSidebarOverlay } from './MobileSidebarOverlay';
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
  hasParallels?: boolean;
  bookSummary?: string | null;
  chapterSummary?: string | null;
  historicalContext?: string | null;
}

export function MobileToolbar({
  bookName,
  chapter,
  maxChapter,
  bookSlug,
  bookId,
  timelineEvents = [],
  hasParallels = false,
  bookSummary = null,
  chapterSummary = null,
  historicalContext = null,
}: MobileToolbarProps) {
  const [showTools, setShowTools] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const bible = searchParams.get('bible');
  const bibleQuery = bible ? `?bible=${bible}` : '';

  // Hide in reading mode
  if (settings.layoutMode === 'reading') {
    return null;
  }

  return (
    <>
      <div className={styles.toolbar}>
        <a
          href={chapter > 1 ? `/${bookSlug}/${chapter - 1}${bibleQuery}` : undefined}
          className={`${styles.navButton} ${chapter === 1 ? styles.disabled : ''}`}
          aria-label={`Forrige kapittel${chapter > 1 ? `: ${bookName} ${chapter - 1}` : ' (ikke tilgjengelig)'}`}
          aria-disabled={chapter === 1}
        >
          ←
        </a>

        <span className={styles.title}>
          {bookName} {chapter}
        </span>

        <button
          className={styles.sidebarButton}
          onClick={() => setShowSidebar(true)}
          title="Panel"
        >
          ▥
        </button>

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
          aria-label={`Neste kapittel${chapter < maxChapter ? `: ${bookName} ${chapter + 1}` : ' (ikke tilgjengelig)'}`}
          aria-disabled={chapter === maxChapter}
        >
          →
        </a>
      </div>

      {showTools && (
        <div className={styles.overlay} onClick={() => setShowTools(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <ToolsPanel onClose={() => setShowTools(false)} hasParallels={hasParallels} />
          </div>
        </div>
      )}

      {showSidebar && (
        <MobileSidebarOverlay
          bookId={bookId}
          chapter={chapter}
          bookName={bookName}
          timelineEvents={timelineEvents}
          bookSummary={bookSummary}
          chapterSummary={chapterSummary}
          historicalContext={historicalContext}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </>
  );
}
