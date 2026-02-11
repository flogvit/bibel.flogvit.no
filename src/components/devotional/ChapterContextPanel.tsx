import { useState, useEffect, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import { extractChapterRefs } from '@/lib/devotional-utils';
import styles from './ChapterContextPanel.module.scss';

interface TimelineEventData {
  id: string;
  title: string;
  description: string | null;
  year_display: string | null;
  period_name: string | null;
  period_color: string | null;
}

export interface ChapterContextData {
  bookId: number;
  chapter: number;
  bookName: string | null;
  bookShortName: string | null;
  bookSummary: string | null;
  summary: string | null;
  context: string | null;
  timelineEvents: TimelineEventData[];
}

interface ChapterContextPanelProps {
  content: string;
  onDataChange?: (data: ChapterContextData[]) => void;
}

export function ChapterContextPanel({ content, onDataChange }: ChapterContextPanelProps) {
  const [contextData, setContextData] = useState<ChapterContextData[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const [collapsedBooks, setCollapsedBooks] = useState<Set<number>>(new Set());
  const cacheRef = useRef<Map<string, ChapterContextData>>(new Map());
  const prevRefsKeyRef = useRef<string>('');

  const fetchContext = useCallback(async (refs: { bookId: number; chapter: number }[]) => {
    if (refs.length === 0) {
      setContextData([]);
      onDataChange?.([]);
      return;
    }

    // Check which refs we already have cached
    const uncached = refs.filter(r => !cacheRef.current.has(`${r.bookId}:${r.chapter}`));

    if (uncached.length > 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/chapter-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapters: uncached }),
        });

        if (res.ok) {
          const data: ChapterContextData[] = await res.json();
          for (const item of data) {
            cacheRef.current.set(`${item.bookId}:${item.chapter}`, item);
          }
        }
      } catch {
        // Silently fail - we'll show what we have cached
      }
      setLoading(false);
    }

    // Build result from cache in the correct order
    const result: ChapterContextData[] = [];
    for (const ref of refs) {
      const cached = cacheRef.current.get(`${ref.bookId}:${ref.chapter}`);
      if (cached) {
        result.push(cached);
      }
    }
    setContextData(result);
    onDataChange?.(result);
  }, [onDataChange]);

  // Debounce content changes and extract refs
  useEffect(() => {
    const timer = setTimeout(() => {
      const refs = extractChapterRefs(content);
      const refsKey = refs.map(r => `${r.bookId}:${r.chapter}`).join(',');

      // Only fetch if refs actually changed
      if (refsKey !== prevRefsKeyRef.current) {
        prevRefsKeyRef.current = refsKey;
        fetchContext(refs);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, fetchContext]);

  function toggleChapter(key: string) {
    setCollapsedChapters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleBook(bookId: number) {
    setCollapsedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  if (contextData.length === 0 && !loading) {
    return (
      <div className={styles.panel}>
        <p className={styles.empty}>
          Legg til versreferanser i teksten for å se kontekst her.
        </p>
      </div>
    );
  }

  // Group by book
  const grouped = new Map<number, { bookName: string; bookSummary: string | null; chapters: ChapterContextData[] }>();
  for (const item of contextData) {
    const existing = grouped.get(item.bookId);
    if (existing) {
      existing.chapters.push(item);
    } else {
      grouped.set(item.bookId, {
        bookName: item.bookName ?? `Bok ${item.bookId}`,
        bookSummary: item.bookSummary,
        chapters: [item],
      });
    }
  }

  return (
    <div className={styles.panel}>
      {loading && <p className={styles.loading}>Laster kontekst...</p>}

      {[...grouped.entries()].map(([bookId, group]) => {
        const isBookCollapsed = collapsedBooks.has(bookId);

        return (
          <div key={bookId} className={styles.bookGroup}>
            <button
              className={styles.bookName}
              onClick={() => toggleBook(bookId)}
            >
              <span className={styles.chapterToggleIcon}>
                {isBookCollapsed ? '\u25B6' : '\u25BC'}
              </span>
              {group.bookName}
            </button>

            {!isBookCollapsed && (
              <>
                {group.bookSummary && (
                  <div className={styles.bookSummary}>
                    <Markdown>{group.bookSummary}</Markdown>
                  </div>
                )}

                {group.chapters.map(ch => {
                  const key = `${ch.bookId}:${ch.chapter}`;
                  const isCollapsed = collapsedChapters.has(key);
                  const hasSummary = !!ch.summary;
                  const hasContext = !!ch.context;

                  return (
                    <div key={key} className={styles.chapterSection}>
                      <button
                        className={styles.chapterToggle}
                        onClick={() => toggleChapter(key)}
                      >
                        <span className={styles.chapterToggleIcon}>
                          {isCollapsed ? '\u25B6' : '\u25BC'}
                        </span>
                        Kapittel {ch.chapter}
                      </button>

                      {!isCollapsed && (
                        <div className={styles.chapterContent}>
                          {hasSummary && (
                            <div className={styles.summaryText}>
                              <Markdown>{ch.summary!}</Markdown>
                            </div>
                          )}

                          {hasContext && (
                            <>
                              <p className={styles.contextLabel}>Historisk kontekst:</p>
                              <div className={styles.contextText}>
                                <Markdown>{ch.context!}</Markdown>
                              </div>
                            </>
                          )}

                          {!hasSummary && !hasContext && (
                            <p className={styles.noData}>Ingen kontekstdata tilgjengelig.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
