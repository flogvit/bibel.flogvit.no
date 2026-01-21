'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToolsPanel } from './ToolsPanel';
import styles from './MobileToolbar.module.scss';

interface MobileToolbarProps {
  bookName: string;
  chapter: number;
  maxChapter: number;
  bookSlug: string;
}

export function MobileToolbar({ bookName, chapter, maxChapter, bookSlug }: MobileToolbarProps) {
  const [showTools, setShowTools] = useState(false);
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
    </>
  );
}
