import { useSettings } from '@/components/SettingsContext';
import { TimelinePanel } from './TimelinePanel';
import { ContextPanel } from './sidebar/ContextPanel';
import type { SidebarTab } from '@/lib/settings';
import type { TimelineEvent } from '@/lib/bible';
import styles from './ReadingSidebar.module.scss';

const tabs: { value: SidebarTab; label: string }[] = [
  { value: 'timeline', label: 'Tidslinje' },
  { value: 'context', label: 'Kontekst' },
  { value: 'resources', label: 'Ressurser' },
  { value: 'lookup', label: 'Oppslag' },
];

interface ReadingSidebarProps {
  bookId: number;
  chapter: number;
  bookName: string;
  timelineEvents: TimelineEvent[];
  chapterEventIds: string[];
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
}

export function ReadingSidebar({
  bookId,
  chapter,
  bookName,
  timelineEvents,
  chapterEventIds,
  bookSummary,
  chapterSummary,
  historicalContext,
}: ReadingSidebarProps) {
  const { settings, updateSetting } = useSettings();
  const activeTab = settings.sidebarTab || 'timeline';

  const setActiveTab = (tab: SidebarTab) => {
    updateSetting('sidebarTab', tab);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'timeline' && (
          <TimelinePanel
            events={timelineEvents}
            chapterEventIds={chapterEventIds}
            currentBookId={bookId}
            currentChapter={chapter}
          />
        )}

        {activeTab === 'context' && (
          <ContextPanel
            bookId={bookId}
            chapter={chapter}
            bookName={bookName}
            bookSummary={bookSummary}
            chapterSummary={chapterSummary}
            historicalContext={historicalContext}
          />
        )}

        {activeTab === 'resources' && (
          <div className={styles.placeholder}>Ressurser (kommer snart)</div>
        )}

        {activeTab === 'lookup' && (
          <div className={styles.placeholder}>Oppslag (kommer snart)</div>
        )}
      </div>
    </div>
  );
}
