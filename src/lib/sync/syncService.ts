/**
 * Sync Service
 *
 * Orchestrates sync between local data and server.
 * - Auto-syncs on data changes (debounced)
 * - Manual sync on demand
 * - Offline queuing with retry on reconnect
 * - Exponential backoff on errors
 */

import { authFetch, isLoggedIn } from '@/lib/auth';
import { addChangeListener, StorageKey } from '@/lib/offline/userData';
import * as userData from '@/lib/offline/userData';
import { markChanged, consumePendingChanges, hasPendingChanges, buildSyncChanges, applyServerChanges } from './changeTracker';
import type { SyncRequest, SyncResponse } from './types';

const DEVICE_ID_KEY = 'bible-sync-device-id';
const LAST_SYNC_KEY = 'bible-sync-last-at';
const SYNC_DEBOUNCE_MS = 3000;
const MAX_RETRY_DELAY_MS = 60000;

const ALL_STORAGE_KEYS: StorageKey[] = [
  'settings', 'favorites', 'notes', 'topics', 'activePlan',
  'planProgress', 'readingPosition', 'verseVersions', 'verseLists', 'devotionals',
];

type SyncStatusCallback = (status: 'idle' | 'syncing' | 'error' | 'offline', error?: string) => void;
type DataUpdateCallback = (updates: Record<string, any>) => void;

let statusCallback: SyncStatusCallback | null = null;
let dataUpdateCallback: DataUpdateCallback | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeChangeListener: (() => void) | null = null;
let isSyncing = false;
let consecutiveErrors = 0;

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getLastSyncAt(): number {
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function setLastSyncAt(timestamp: number): void {
  localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
}

async function gatherAllData(): Promise<Record<string, any>> {
  const [
    settings, favorites, notes, topics, activePlan,
    planProgress, readingPosition, verseVersions, verseLists, devotionals,
  ] = await Promise.all([
    userData.getSettings(),
    userData.getFavorites(),
    userData.getNotes(),
    userData.getTopics(),
    userData.getActivePlanId(),
    userData.getAllPlanProgress(),
    userData.getReadingPosition(),
    userData.getVerseVersions(),
    userData.getVerseLists(),
    userData.getDevotionals(),
  ]);

  return {
    settings, favorites, notes, topics, activePlan,
    planProgress, readingPosition, verseVersions, verseLists, devotionals,
  };
}

async function saveUpdatesToLocal(updates: Record<string, any>): Promise<void> {
  const saveMap: Record<string, (data: any) => Promise<void>> = {
    settings: userData.saveSettings,
    favorites: userData.saveFavorites,
    notes: userData.saveNotes,
    topics: userData.saveTopics,
    activePlan: (data) => userData.setActivePlanId(data),
    planProgress: userData.savePlanProgress,
    readingPosition: userData.saveReadingPosition,
    verseVersions: userData.saveVerseVersions,
    verseLists: userData.saveVerseLists,
    devotionals: userData.saveDevotionals,
  };

  for (const [key, data] of Object.entries(updates)) {
    const saveFn = saveMap[key];
    if (saveFn && data !== undefined) {
      await saveFn(data);
    }
  }
}

/**
 * Calculate retry delay with exponential backoff.
 */
function getRetryDelay(): number {
  const base = 1000;
  const delay = Math.min(base * Math.pow(2, consecutiveErrors), MAX_RETRY_DELAY_MS);
  // Add jitter (0-25%)
  return delay + Math.random() * delay * 0.25;
}

/**
 * Schedule a retry after an error.
 */
function scheduleRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  const delay = getRetryDelay();
  retryTimer = setTimeout(() => {
    if (hasPendingChanges() || consecutiveErrors > 0) {
      performSync();
    }
  }, delay);
}

/**
 * Perform the actual sync with the server.
 */
export async function performSync(fullSync = false): Promise<number> {
  if (isSyncing) return getLastSyncAt();
  if (!isLoggedIn()) return 0;
  if (!navigator.onLine) {
    statusCallback?.('offline');
    return getLastSyncAt();
  }

  isSyncing = true;
  statusCallback?.('syncing');

  try {
    const changedKeys = fullSync
      ? new Set(ALL_STORAGE_KEYS)
      : consumePendingChanges();

    const allData = await gatherAllData();
    const changes = buildSyncChanges(
      fullSync ? new Set(ALL_STORAGE_KEYS) : changedKeys,
      allData
    );

    const request: SyncRequest = {
      deviceId: getDeviceId(),
      lastSyncAt: fullSync ? 0 : getLastSyncAt(),
      changes,
    };

    const res = await authFetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }

    const response: SyncResponse = await res.json();

    // Apply server changes to local data
    if (response.changes.length > 0) {
      const updates = applyServerChanges(response.changes, allData);
      await saveUpdatesToLocal(updates);
      dataUpdateCallback?.(updates);
    }

    setLastSyncAt(response.syncedAt);
    consecutiveErrors = 0;
    statusCallback?.('idle');
    return response.syncedAt;
  } catch (err) {
    console.error('Sync error:', err);
    consecutiveErrors++;
    statusCallback?.('error', err instanceof Error ? err.message : 'Sync failed');
    scheduleRetry();
    return getLastSyncAt();
  } finally {
    isSyncing = false;
  }
}

function scheduleSyncDebounced(): void {
  if (!isLoggedIn()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performSync();
  }, SYNC_DEBOUNCE_MS);
}

export function startSyncService(
  onStatus: SyncStatusCallback,
  onDataUpdate: DataUpdateCallback
): void {
  statusCallback = onStatus;
  dataUpdateCallback = onDataUpdate;
  consecutiveErrors = 0;

  if (unsubscribeChangeListener) unsubscribeChangeListener();
  unsubscribeChangeListener = addChangeListener((key: StorageKey) => {
    if (isSyncing) return;
    markChanged(key);
    scheduleSyncDebounced();
  });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export function stopSyncService(): void {
  if (unsubscribeChangeListener) {
    unsubscribeChangeListener();
    unsubscribeChangeListener = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  statusCallback = null;
  dataUpdateCallback = null;
}

function handleOnline(): void {
  consecutiveErrors = 0;
  if (hasPendingChanges()) {
    performSync();
  } else {
    statusCallback?.('idle');
  }
}

function handleOffline(): void {
  statusCallback?.('offline');
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}
