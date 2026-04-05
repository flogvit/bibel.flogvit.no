import { useState } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { TimelineMobileOverlay } from './TimelineMobileOverlay';
import { ContextPanel } from './sidebar/ContextPanel';
import { ResourcesPanel } from './sidebar/ResourcesPanel';
import { LookupPanel } from './sidebar/LookupPanel';
import type { SidebarTab } from '@/lib/settings';
import type { TimelineEvent } from '@/lib/bible';
import styles from './MobileSidebarOverlay.module.scss';

const tabs: { value: SidebarTab; label: string }[] = [
  { value: 'timeline', label: 'Tidslinje' },
  { value: 'context', label: 'Kontekst' },
  { value: 'resources', label: 'Ressurser' },
  { value: 'lookup', label: 'Oppslag' },
];

interface MobileSidebarOverlayProps {
  bookId: number;
  chapter: number;
  bookName: string;
  timelineEvents: TimelineEvent[];
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
  onClose: () => void;
}

export function MobileSidebarOverlay({
  bookId,
  chapter,
  bookName,
  timelineEvents,
  bookSummary,
  chapterSummary,
  historicalContext,
  onClose,
}: MobileSidebarOverlayProps) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<SidebarTab>(settings.sidebarTab || 'timeline');

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
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
        <button className={styles.closeButton} onClick={onClose} aria-label="Lukk panel">
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'timeline' && (
          <TimelineMobileOverlay
            events={timelineEvents}
            currentBookId={bookId}
            currentChapter={chapter}
            onClose={onClose}
            embedded
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
          <ResourcesPanel bookId={bookId} chapter={chapter} bookName={bookName} />
        )}

        {activeTab === 'lookup' && <LookupPanel />}
      </div>
    </div>
  );
}
