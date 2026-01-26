import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // True if user was offline and came back online
}

// Get initial online status synchronously
function getInitialOnlineStatus(): boolean {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(prev => {
      // Only set wasOffline if we were actually offline before
      if (!prev) {
        setWasOffline(true);
        // Reset wasOffline after a delay
        setTimeout(() => setWasOffline(false), 5000);
      }
      return true;
    });
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}

/**
 * Hook to check if a specific chapter is available offline
 */
export function useChapterOfflineStatus(
  bookId: number,
  chapter: number,
  bible: string
): { isAvailableOffline: boolean; isChecking: boolean } {
  const [isAvailableOffline, setIsAvailableOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkCache() {
      setIsChecking(true);
      try {
        // Check Service Worker cache
        if ('caches' in window) {
          const cache = await caches.open('bibel-api-v1');
          const url = `/api/chapter?book=${bookId}&chapter=${chapter}&bible=${bible}`;
          const cached = await cache.match(url);
          setIsAvailableOffline(!!cached);
        }
      } catch {
        setIsAvailableOffline(false);
      }
      setIsChecking(false);
    }

    checkCache();
  }, [bookId, chapter, bible]);

  return { isAvailableOffline, isChecking };
}
