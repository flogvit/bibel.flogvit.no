

import { useState, useEffect, useCallback } from 'react';
import { getStoredTimeline, storeTimeline } from '@/lib/offline/storage';
import type { TimelineEvent } from '@/lib/bible';

interface UseTimelineResult {
  events: TimelineEvent[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function useTimeline(): UseTimelineResult {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch('/api/timeline');

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Tidslinjen er ikke tilgjengelig offline');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const timelineEvents = data.events || [];

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setEvents(timelineEvents);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB && timelineEvents.length > 0) {
        try {
          await storeTimeline({
            events: timelineEvents,
            periods: data.periods || [],
            cachedAt: Date.now(),
          });
        } catch (storeError) {
          console.warn('Failed to store timeline in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getStoredTimeline();
        if (cached) {
          setEvents(cached.events as TimelineEvent[]);
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste tidslinjen');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && events.length === 0) {
        fetchTimeline();
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
  }, [isOffline, events.length, fetchTimeline]);

  return {
    events,
    isLoading,
    error,
    isOffline,
    refetch: fetchTimeline,
  };
}
