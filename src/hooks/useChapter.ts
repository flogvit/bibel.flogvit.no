

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChapterAPIResponse } from '@/types/api';
import { storeChapter, getStoredChapter } from '@/lib/offline/storage';

interface UseChapterOptions {
  bookId: number;
  chapter: number;
  bible?: string;
  secondaryBible?: string;
  numberingSystem?: string;
}

interface UseChapterResult {
  data: ChapterAPIResponse | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useChapter({ bookId, chapter, bible = 'osnb2', secondaryBible, numberingSystem }: UseChapterOptions): UseChapterResult {
  const [data, setData] = useState<ChapterAPIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Generation counter to prevent stale async operations from overwriting fresh data
  const fetchGenRef = useRef(0);

  const fetchChapter = useCallback(async () => {
    if (!bookId || !chapter) return;

    const generation = ++fetchGenRef.current;
    const isStale = () => generation !== fetchGenRef.current;

    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    // User bibles are stored locally in IndexedDB
    if (bible.startsWith('user:')) {
      try {
        const cached = await getStoredChapter(bookId, chapter, bible);
        if (isStale()) return;
        if (!cached) {
          setError('Kapittelet finnes ikke i denne oversettelsen');
          setIsLoading(false);
          return;
        }

        // Fetch osnb2 chapter data for study tools (summary, references, etc.)
        let studyData: Partial<ChapterAPIResponse> = {};
        try {
          const needsServerSecondary = secondaryBible && secondaryBible !== 'original' && !secondaryBible.startsWith('user:');
          const secondaryParam = needsServerSecondary && secondaryBible !== 'osnb2' ? `&secondary=${secondaryBible}` : '';
          const res = await fetch(`/api/chapter?book=${bookId}&chapter=${chapter}&bible=osnb2${secondaryParam}`);
          if (isStale()) return;
          if (res.ok) {
            const d = await res.json();
            // If secondary is osnb2, the osnb2 verses themselves are the secondary text
            const secondaryVerses = needsServerSecondary
              ? (secondaryBible === 'osnb2'
                ? d.verses.map((v: { verse: number; text: string }) => ({ verse: v.verse, text: v.text }))
                : d.secondaryVerses)
              : undefined;
            studyData = {
              originalVerses: d.originalVerses,
              secondaryVerses,
              word4word: d.word4word,
              references: d.references,
              bookSummary: d.bookSummary,
              summary: d.summary,
              context: d.context,
              insight: d.insight,
            };
          }
        } catch {
          if (isStale()) return;
          // Try IndexedDB cache for osnb2
          const osnb2Cached = await getStoredChapter(bookId, chapter, 'osnb2');
          if (isStale()) return;
          if (osnb2Cached) {
            studyData = {
              originalVerses: osnb2Cached.originalVerses,
              word4word: osnb2Cached.word4word as ChapterAPIResponse['word4word'],
              references: osnb2Cached.references as ChapterAPIResponse['references'],
              bookSummary: osnb2Cached.bookSummary,
              summary: osnb2Cached.summary,
              context: osnb2Cached.context,
              insight: osnb2Cached.insight,
            };
          }
        }

        if (isStale()) return;
        setData({
          bookId: cached.bookId,
          chapter: cached.chapter,
          bible: cached.bible,
          verses: cached.verses as ChapterAPIResponse['verses'],
          originalVerses: studyData.originalVerses || [],
          ...(studyData.secondaryVerses && { secondaryVerses: studyData.secondaryVerses }),
          word4word: (studyData.word4word || {}) as ChapterAPIResponse['word4word'],
          references: (studyData.references || {}) as ChapterAPIResponse['references'],
          bookSummary: studyData.bookSummary || null,
          summary: studyData.summary || null,
          context: studyData.context || null,
          insight: studyData.insight || null,
          cachedAt: cached.cachedAt,
        });
      } catch (err) {
        if (isStale()) return;
        console.error('Failed to load user bible chapter:', err);
        setError('Kunne ikke laste kapittelet');
      } finally {
        if (!isStale()) setIsLoading(false);
      }
      return;
    }

    try {
      const secondaryParam = secondaryBible && secondaryBible !== 'original' && !secondaryBible.startsWith('user:') ? `&secondary=${secondaryBible}` : '';
      const numberingParam = numberingSystem && numberingSystem !== 'osnb2' ? `&numbering=${numberingSystem}` : '';
      const response = await fetch(`/api/chapter?book=${bookId}&chapter=${chapter}&bible=${bible}${secondaryParam}${numberingParam}`);
      if (isStale()) return;

      if (!response.ok) {
        // Check if this is an offline error from the service worker
        if (response.status === 503) {
          const errorData = await response.json();
          if (isStale()) return;
          if (errorData.offline) {
            setIsOffline(true);
            setError('Kapittelet er ikke tilgjengelig offline');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const chapterData: ChapterAPIResponse = await response.json();
      if (isStale()) return;

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setData(chapterData);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB) {
        try {
          await storeChapter({
            bookId: chapterData.bookId,
            chapter: chapterData.chapter,
            bible: chapterData.bible,
            verses: chapterData.verses,
            originalVerses: chapterData.originalVerses,
            word4word: chapterData.word4word,
            references: chapterData.references,
            bookSummary: chapterData.bookSummary,
            summary: chapterData.summary,
            context: chapterData.context,
            insight: chapterData.insight,
            cachedAt: chapterData.cachedAt || Date.now(),
          });
        } catch (storeError) {
          console.warn('Failed to store chapter in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      if (isStale()) return;
      console.error('Failed to fetch chapter:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getStoredChapter(bookId, chapter, bible);
        if (isStale()) return;
        if (cached) {
          // Cast to ChapterAPIResponse - IndexedDB types are compatible but looser
          setData({
            bookId: cached.bookId,
            chapter: cached.chapter,
            bible: cached.bible,
            verses: cached.verses as ChapterAPIResponse['verses'],
            originalVerses: cached.originalVerses || [],
            word4word: (cached.word4word || {}) as ChapterAPIResponse['word4word'],
            references: (cached.references || {}) as ChapterAPIResponse['references'],
            bookSummary: cached.bookSummary || null,
            summary: cached.summary || null,
            context: cached.context || null,
            insight: cached.insight || null,
            cachedAt: cached.cachedAt,
          });
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste kapittelet');
      setIsOffline(!navigator.onLine);
    } finally {
      if (!isStale()) setIsLoading(false);
    }
  }, [bookId, chapter, bible, secondaryBible, numberingSystem]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && !data) {
        fetchChapter();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, data, fetchChapter]);

  return {
    data,
    isLoading,
    error,
    isOffline,
    refetch: fetchChapter,
  };
}
