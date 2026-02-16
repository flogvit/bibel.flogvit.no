/**
 * Change Tracker
 *
 * Tracks local changes between sync cycles and converts
 * local data structures into sync protocol format.
 */

import type { SyncChange } from './types';
import type { StorageKey } from '@/lib/offline/userData';

// Track which storage keys have changed since last sync
const pendingChanges = new Set<StorageKey>();

/**
 * Mark a storage key as having pending changes.
 */
export function markChanged(key: StorageKey): void {
  pendingChanges.add(key);
}

/**
 * Check if there are any pending changes.
 */
export function hasPendingChanges(): boolean {
  return pendingChanges.size > 0;
}

/**
 * Clear all pending changes (after successful sync).
 */
export function clearPendingChanges(): void {
  pendingChanges.clear();
}

/**
 * Get pending storage keys and clear them.
 */
export function consumePendingChanges(): Set<StorageKey> {
  const changes = new Set(pendingChanges);
  pendingChanges.clear();
  return changes;
}

// Map StorageKey to sync data type names
const storageKeyToDataType: Record<StorageKey, string> = {
  settings: 'settings',
  favorites: 'favorites',
  notes: 'notes',
  topics: 'topics',
  activePlan: 'activePlan',
  planProgress: 'planProgress',
  readingPosition: 'readingPosition',
  verseVersions: 'verseVersions',
  verseLists: 'verseLists',
  devotionals: 'devotionals',
};

/**
 * Convert local data to sync changes format.
 * Each data type is decomposed into sync items.
 */
export function buildSyncChanges(
  changedKeys: Set<StorageKey>,
  allData: Record<string, any>
): SyncChange[] {
  const changes: SyncChange[] = [];
  const now = Date.now();

  for (const key of changedKeys) {
    const dataType = storageKeyToDataType[key];
    const data = allData[key];

    switch (key) {
      case 'settings':
      case 'activePlan':
      case 'readingPosition':
      case 'verseVersions':
        // Singletons: one item with _singleton id
        changes.push({
          dataType,
          itemId: '_singleton',
          data: data ?? null,
          updatedAt: now,
        });
        break;

      case 'favorites':
        // Per-item: each favorite is a separate sync item
        if (Array.isArray(data)) {
          for (const fav of data) {
            changes.push({
              dataType,
              itemId: `${fav.bookId}-${fav.chapter}-${fav.verse}`,
              data: fav,
              updatedAt: fav.addedAt || now,
            });
          }
        }
        break;

      case 'notes':
        // Per-item: each note has its own id and updatedAt
        if (Array.isArray(data)) {
          for (const note of data) {
            changes.push({
              dataType,
              itemId: note.id,
              data: note,
              updatedAt: note.updatedAt || now,
            });
          }
        }
        break;

      case 'topics':
        // Entire topics data as singleton (topics + verseTopics + itemTopics are interconnected)
        changes.push({
          dataType,
          itemId: '_singleton',
          data: data ?? { topics: [], verseTopics: [], itemTopics: [] },
          updatedAt: now,
        });
        break;

      case 'planProgress':
        // Per-plan: each plan's progress is a separate sync item
        if (data && typeof data === 'object') {
          for (const [planId, progress] of Object.entries(data)) {
            changes.push({
              dataType,
              itemId: planId,
              data: progress,
              updatedAt: now,
            });
          }
        }
        break;

      case 'verseLists':
        // Per-item: each list has its own id and updatedAt
        if (Array.isArray(data)) {
          for (const list of data) {
            changes.push({
              dataType,
              itemId: list.id,
              data: list,
              updatedAt: list.updatedAt || now,
            });
          }
        }
        break;

      case 'devotionals':
        // Per-item: each devotional has its own id and updatedAt
        if (Array.isArray(data)) {
          for (const dev of data) {
            changes.push({
              dataType,
              itemId: dev.id,
              data: dev,
              updatedAt: dev.updatedAt || now,
            });
          }
        }
        break;
    }
  }

  return changes;
}

/**
 * Apply server changes back to local data structures.
 * Returns an object keyed by StorageKey with updated data.
 */
export function applyServerChanges(
  serverChanges: SyncChange[],
  currentData: Record<string, any>
): Record<string, any> {
  const updates: Record<string, any> = {};

  // Group changes by data type
  const byType = new Map<string, SyncChange[]>();
  for (const change of serverChanges) {
    const list = byType.get(change.dataType) || [];
    list.push(change);
    byType.set(change.dataType, list);
  }

  // Process each data type
  for (const [dataType, changes] of byType) {
    switch (dataType) {
      case 'settings':
      case 'activePlan':
      case 'readingPosition':
      case 'verseVersions': {
        // Singletons
        const change = changes[0];
        if (change) {
          updates[dataType] = change.deleted ? null : change.data;
        }
        break;
      }

      case 'favorites': {
        // Rebuild favorites array from server changes
        const current: any[] = [...(currentData.favorites || [])];
        for (const change of changes) {
          const idx = current.findIndex((f: any) =>
            `${f.bookId}-${f.chapter}-${f.verse}` === change.itemId
          );
          if (change.deleted) {
            if (idx >= 0) current.splice(idx, 1);
          } else if (idx >= 0) {
            current[idx] = change.data;
          } else {
            current.push(change.data);
          }
        }
        updates.favorites = current;
        break;
      }

      case 'notes': {
        const current: any[] = [...(currentData.notes || [])];
        for (const change of changes) {
          const idx = current.findIndex((n: any) => n.id === change.itemId);
          if (change.deleted) {
            if (idx >= 0) current.splice(idx, 1);
          } else if (idx >= 0) {
            current[idx] = change.data;
          } else {
            current.push(change.data);
          }
        }
        updates.notes = current;
        break;
      }

      case 'topics': {
        const change = changes[0];
        if (change && !change.deleted) {
          updates.topics = change.data;
        }
        break;
      }

      case 'planProgress': {
        const current: Record<string, any> = { ...(currentData.planProgress || {}) };
        for (const change of changes) {
          if (change.deleted) {
            delete current[change.itemId];
          } else {
            current[change.itemId] = change.data;
          }
        }
        updates.planProgress = current;
        break;
      }

      case 'verseLists': {
        const current: any[] = [...(currentData.verseLists || [])];
        for (const change of changes) {
          const idx = current.findIndex((l: any) => l.id === change.itemId);
          if (change.deleted) {
            if (idx >= 0) current.splice(idx, 1);
          } else if (idx >= 0) {
            current[idx] = change.data;
          } else {
            current.push(change.data);
          }
        }
        updates.verseLists = current;
        break;
      }

      case 'devotionals': {
        const current: any[] = [...(currentData.devotionals || [])];
        for (const change of changes) {
          const idx = current.findIndex((d: any) => d.id === change.itemId);
          if (change.deleted) {
            if (idx >= 0) current.splice(idx, 1);
          } else if (idx >= 0) {
            current[idx] = change.data;
          } else {
            current.push(change.data);
          }
        }
        updates.devotionals = current;
        break;
      }
    }
  }

  return updates;
}
