import { useState } from 'react';
import { InlineRefs } from '@/components/InlineRefs';
import { ImportantWords } from '@/components/bible/ImportantWords';
import styles from './ContextPanel.module.scss';

interface ContextPanelProps {
  bookId: number;
  chapter: number;
  bookName: string;
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
}

interface SectionState {
  book: boolean;
  chapter: boolean;
  context: boolean;
  words: boolean;
}

export function ContextPanel({
  bookId,
  chapter,
  bookName,
  bookSummary,
  chapterSummary,
  historicalContext,
}: ContextPanelProps) {
  const [open, setOpen] = useState<SectionState>({
    book: true,
    chapter: true,
    context: true,
    words: true,
  });

  const toggle = (key: keyof SectionState) => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasContent = bookSummary || chapterSummary || historicalContext;

  if (!hasContent) {
    return (
      <div className={styles.empty}>
        Ingen kontekstinformasjon tilgjengelig for dette kapittelet.
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {bookSummary && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('book')}>
            <span>Om {bookName}</span>
            <span className={styles.chevron}>{open.book ? '▾' : '▸'}</span>
          </button>
          {open.book && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{bookSummary}</InlineRefs>
            </div>
          )}
        </section>
      )}

      {chapterSummary && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('chapter')}>
            <span>Kapittel {chapter}</span>
            <span className={styles.chevron}>{open.chapter ? '▾' : '▸'}</span>
          </button>
          {open.chapter && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{chapterSummary}</InlineRefs>
            </div>
          )}
        </section>
      )}

      {historicalContext && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('context')}>
            <span>Historisk kontekst</span>
            <span className={styles.chevron}>{open.context ? '▾' : '▸'}</span>
          </button>
          {open.context && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{historicalContext}</InlineRefs>
            </div>
          )}
        </section>
      )}

      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggle('words')}>
          <span>Viktige ord</span>
          <span className={styles.chevron}>{open.words ? '▾' : '▸'}</span>
        </button>
        {open.words && (
          <div className={styles.sectionContent}>
            <ImportantWords bookId={bookId} chapter={chapter} embedded />
          </div>
        )}
      </section>
    </div>
  );
}
