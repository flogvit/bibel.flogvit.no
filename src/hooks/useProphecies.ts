

import { useState, useEffect, useCallback } from 'react';
import { getStoredProphecies, storeProphecies } from '@/lib/offline/storage';

// API format types (what comes from the API)
export interface ProphecyCategory {
  id: number | string;
  name: string;
  description: string | null;
}

export interface ProphecyFulfillment {
  id?: number;
  prophecy_id?: number;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  fulfilled_text?: string;
  book_short_name?: string;
}

export interface Prophecy {
  id: number | string;
  category_id: number | string;
  title: string;
  description?: string | null;
  explanation?: string | null;
  gt_book_id?: number;
  gt_chapter?: number;
  gt_verse_start?: number;
  gt_verse_end?: number | null;
  gt_text?: string;
  book_short_name?: string;
  fulfillments?: ProphecyFulfillment[];
  prophecy?: ProphecyFulfillment;
  category?: ProphecyCategory;
}

interface UsePropheciesResult {
  categories: ProphecyCategory[];
  prophecies: Prophecy[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useProphecies(): UsePropheciesResult {
  const [categories, setCategories] = useState<ProphecyCategory[]>([]);
  const [prophecies, setProphecies] = useState<Prophecy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchProphecies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch('/api/prophecies');

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Profetier er ikke tilgjengelig offline');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setCategories(data.categories || []);
      setProphecies(data.prophecies || []);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB) {
        try {
          await storeProphecies({
            categories: data.categories || [],
            prophecies: data.prophecies || [],
            cachedAt: Date.now(),
          });
        } catch (storeError) {
          console.warn('Failed to store prophecies in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch prophecies:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getStoredProphecies();
        if (cached) {
          setCategories(cached.categories as ProphecyCategory[]);
          setProphecies(cached.prophecies as Prophecy[]);
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste profetier');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProphecies();
  }, [fetchProphecies]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && prophecies.length === 0) {
        fetchProphecies();
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
  }, [isOffline, prophecies.length, fetchProphecies]);

  return {
    categories,
    prophecies,
    isLoading,
    error,
    isOffline,
    refetch: fetchProphecies,
  };
}
