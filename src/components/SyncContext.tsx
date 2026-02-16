import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { startSyncService, stopSyncService, performSync } from '@/lib/sync/syncService';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncContextType {
  status: SyncStatus;
  lastSyncAt: number | null;
  syncNow: () => Promise<void>;
  error: string | null;
}

const SyncContext = createContext<SyncContextType | null>(null);

/**
 * Custom event dispatched when sync applies server changes.
 * Context providers listen for this to refresh from storage.
 */
export function dispatchSyncRefresh(): void {
  window.dispatchEvent(new CustomEvent('bible-sync-refresh'));
}

/**
 * Hook for context providers to refresh from storage after sync.
 */
export function useSyncRefresh(refreshFn: () => void): void {
  useEffect(() => {
    const handler = () => refreshFn();
    window.addEventListener('bible-sync-refresh', handler);
    return () => window.removeEventListener('bible-sync-refresh', handler);
  }, [refreshFn]);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(() => {
    const stored = localStorage.getItem('bible-sync-last-at');
    return stored ? parseInt(stored, 10) : null;
  });
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = useCallback((newStatus: SyncStatus, err?: string) => {
    setStatus(newStatus);
    setError(err || null);
  }, []);

  const handleDataUpdate = useCallback(() => {
    dispatchSyncRefresh();
  }, []);

  // Start/stop sync service based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      startSyncService(handleStatusUpdate, handleDataUpdate);

      // Initial sync on login
      performSync().then(syncedAt => {
        if (syncedAt > 0) setLastSyncAt(syncedAt);
      });

      return () => stopSyncService();
    } else {
      stopSyncService();
      setStatus('idle');
    }
  }, [isAuthenticated, handleStatusUpdate, handleDataUpdate]);

  const syncNow = useCallback(async () => {
    if (!isAuthenticated) return;
    const syncedAt = await performSync(true);
    if (syncedAt > 0) setLastSyncAt(syncedAt);
  }, [isAuthenticated]);

  return (
    <SyncContext.Provider value={{ status, lastSyncAt, syncNow, error }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
