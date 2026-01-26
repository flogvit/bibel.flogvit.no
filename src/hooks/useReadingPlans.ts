

import { useState, useEffect, useCallback } from 'react';
import { getAllStoredReadingPlans, storeReadingPlans, getStoredReadingPlan, storeReadingPlan } from '@/lib/offline/storage';

export interface ReadingPlanDay {
  day: number;
  readings: {
    book_id: number;
    book_short_name: string;
    chapter_start: number;
    chapter_end?: number;
    verse_start?: number;
    verse_end?: number;
  }[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description?: string;
  duration_days: number;
  days: ReadingPlanDay[];
}

interface UseReadingPlansResult {
  plans: ReadingPlan[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

interface UseReadingPlanResult {
  plan: ReadingPlan | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useReadingPlans(): UseReadingPlansResult {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch('/api/reading-plans');

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Leseplaner er ikke tilgjengelig offline');
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

      setPlans(data.plans || []);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB && data.plans?.length > 0) {
        try {
          // Convert API format to ReadingPlanData format
          await storeReadingPlans(data.plans.map((p: ReadingPlan) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            category: '',
            days: p.duration_days,
            readings: p.days.map(d => ({
              day: d.day,
              chapters: d.readings.map(r => ({ bookId: r.book_id, chapter: r.chapter_start })),
            })),
          })));
        } catch (storeError) {
          console.warn('Failed to store reading plans in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reading plans:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getAllStoredReadingPlans();
        if (cached.length > 0) {
          // Convert ReadingPlanData format back to API format
          setPlans(cached.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            duration_days: p.days,
            days: p.readings.map(r => ({
              day: r.day,
              readings: r.chapters.map(c => ({
                book_id: c.bookId,
                book_short_name: '',
                chapter_start: c.chapter,
              })),
            })),
          } as ReadingPlan)));
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste leseplaner');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && plans.length === 0) {
        fetchPlans();
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
  }, [isOffline, plans.length, fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    isOffline,
    refetch: fetchPlans,
  };
}

export function useReadingPlan(planId: string): UseReadingPlanResult {
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!planId) return;

    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch(`/api/reading-plans/${encodeURIComponent(planId)}`);

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Leseplanen er ikke tilgjengelig offline');
            return;
          }
        }
        if (response.status === 404) {
          setError('Leseplanen ble ikke funnet');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setPlan(data);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB && data) {
        try {
          // Convert API format to ReadingPlanData format
          await storeReadingPlan({
            id: data.id,
            name: data.name,
            description: data.description || '',
            category: '',
            days: data.duration_days,
            readings: data.days.map((d: ReadingPlanDay) => ({
              day: d.day,
              chapters: d.readings.map(r => ({ bookId: r.book_id, chapter: r.chapter_start })),
            })),
          });
        } catch (storeError) {
          console.warn('Failed to store reading plan in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reading plan:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getStoredReadingPlan(planId);
        if (cached) {
          // Convert ReadingPlanData format back to API format
          setPlan({
            id: cached.id,
            name: cached.name,
            description: cached.description,
            duration_days: cached.days,
            days: cached.readings.map(r => ({
              day: r.day,
              readings: r.chapters.map(c => ({
                book_id: c.bookId,
                book_short_name: '',
                chapter_start: c.chapter,
              })),
            })),
          } as ReadingPlan);
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste leseplanen');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && !plan) {
        fetchPlan();
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
  }, [isOffline, plan, fetchPlan]);

  return {
    plan,
    isLoading,
    error,
    isOffline,
    refetch: fetchPlan,
  };
}
