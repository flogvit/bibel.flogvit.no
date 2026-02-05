import { useState, useEffect, useCallback } from 'react';
import type { GospelParallel } from '@/lib/bible';

interface UseChapterParallelsResult {
  parallels: GospelParallel[];
  isLoading: boolean;
  error: string | null;
  hasParallels: boolean;
}

// Only gospel books (Matthew=40, Mark=41, Luke=42, John=43) can have parallels
const GOSPEL_BOOK_IDS = [40, 41, 42, 43];

export function useChapterParallels(bookId: number, chapter: number): UseChapterParallelsResult {
  const [parallels, setParallels] = useState<GospelParallel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGospelBook = GOSPEL_BOOK_IDS.includes(bookId);

  const fetchParallels = useCallback(async () => {
    if (!isGospelBook) {
      setParallels([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parallels/chapter/${bookId}/${chapter}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setParallels(data.parallels || []);
    } catch (err) {
      console.error('Failed to fetch chapter parallels:', err);
      setError('Kunne ikke laste paralleller');
      setParallels([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapter, isGospelBook]);

  useEffect(() => {
    fetchParallels();
  }, [fetchParallels]);

  return {
    parallels,
    isLoading,
    error,
    hasParallels: parallels.length > 0,
  };
}
