import { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { TimelinePanel } from './TimelinePanel';
import { ContextPanel } from './sidebar/ContextPanel';
import { LookupPanel } from './sidebar/LookupPanel';
import { ResourcesPanel } from './sidebar/ResourcesPanel';
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
  onWidthChange?: (width: number) => void;
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
  onWidthChange,
}: ReadingSidebarProps) {
  const { settings, updateSetting } = useSettings();
  const activeTab = settings.sidebarTab || 'timeline';
  const isPanelMode = settings.layoutMode === 'panel';

  const setActiveTab = (tab: SidebarTab) => {
    updateSetting('sidebarTab', tab);
  };

  // Drag resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const width = dragWidth ?? (settings.sidebarWidth || 280);
  const savedWidthRef = useRef(settings.sidebarWidth || 280);

  // Keep ref in sync with setting
  useEffect(() => {
    savedWidthRef.current = settings.sidebarWidth || 280;
  }, [settings.sidebarWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPanelMode) return;
    e.preventDefault();
    setIsDragging(true);
  }, [isPanelMode]);

  const handleDoubleClick = useCallback(() => {
    if (isPanelMode) return;
    const halfScreen = Math.floor(window.innerWidth / 2);
    const currentWidth = settings.sidebarWidth || 280;
    const newWidth = currentWidth >= halfScreen - 20 ? 280 : halfScreen;
    updateSetting('sidebarWidth', newWidth);
  }, [isPanelMode, settings.sidebarWidth, updateSetting]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(
        Math.max(200, window.innerWidth - e.clientX),
        Math.floor(window.innerWidth * 0.5)
      );
      setDragWidth(newWidth);
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragWidth !== null) {
        updateSetting('sidebarWidth', dragWidth);
        setDragWidth(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragWidth, updateSetting]);

  return (
    <div className={styles.sidebar}>
      {!isPanelMode && (
        <div
          className={`${styles.resizeHandle} ${isDragging ? styles.dragging : ''}`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Dra for å endre bredde, dobbelklikk for 50%"
        />
      )}

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
          <ResourcesPanel bookId={bookId} chapter={chapter} bookName={bookName} />
        )}

        {activeTab === 'lookup' && <LookupPanel />}
      </div>
    </div>
  );
}
