import { getOfflineDb, SyncState, StoredChapter } from './db';
import type { SyncStatusResponse, SyncChaptersResponse } from '@/types/api';

/**
 * Get the local sync version from IndexedDB
 */
export async function getLocalSyncVersion(): Promise<number> {
  try {
    const db = await getOfflineDb();
    const state = await db.get('syncState', 'state');
    return state?.syncVersion || 0;
  } catch (error) {
    console.error('[Sync] Failed to get local sync version:', error);
    return 0;
  }
}

/**
 * Set the local sync version in IndexedDB
 */
export async function setLocalSyncVersion(version: number): Promise<void> {
  try {
    const db = await getOfflineDb();
    const state: SyncState = {
      syncVersion: version,
      lastSyncedAt: new Date().toISOString(),
    };
    await db.put('syncState', state, 'state');
  } catch (error) {
    console.error('[Sync] Failed to set local sync version:', error);
  }
}

/**
 * Check for updates from the server
 */
export async function checkForUpdates(): Promise<{
  hasUpdates: boolean;
  currentVersion: number;
  changedChapters: string[];
  timelineChanged: boolean;
  propheciesChanged: boolean;
  changedPersons: string[];
  changedReadingPlans: string[];
}> {
  const localVersion = await getLocalSyncVersion();

  try {
    const response = await fetch(`/api/sync/status?since=${localVersion}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: SyncStatusResponse = await response.json();

    const hasUpdates =
      data.currentVersion > localVersion ||
      data.changes.chapters.length > 0 ||
      data.changes.timeline ||
      data.changes.prophecies ||
      data.changes.persons.length > 0 ||
      data.changes.readingPlans.length > 0;

    return {
      hasUpdates,
      currentVersion: data.currentVersion,
      changedChapters: data.changes.chapters,
      timelineChanged: data.changes.timeline,
      propheciesChanged: data.changes.prophecies,
      changedPersons: data.changes.persons,
      changedReadingPlans: data.changes.readingPlans,
    };
  } catch (error) {
    console.error('[Sync] Failed to check for updates:', error);
    return {
      hasUpdates: false,
      currentVersion: localVersion,
      changedChapters: [],
      timelineChanged: false,
      propheciesChanged: false,
      changedPersons: [],
      changedReadingPlans: [],
    };
  }
}

/**
 * Split an array into chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sync progress callback
 */
export interface SyncProgress {
  phase: 'checking' | 'chapters' | 'timeline' | 'prophecies' | 'persons' | 'plans' | 'complete';
  current: number;
  total: number;
  message: string;
}

/**
 * Perform incremental sync
 */
export async function syncIncrementally(
  onProgress?: (progress: SyncProgress) => void,
  bible: string = 'osnb2'
): Promise<{
  success: boolean;
  chaptersUpdated: number;
  newVersion: number;
}> {
  onProgress?.({
    phase: 'checking',
    current: 0,
    total: 0,
    message: 'Sjekker etter oppdateringer...',
  });

  const updates = await checkForUpdates();

  if (!updates.hasUpdates) {
    onProgress?.({
      phase: 'complete',
      current: 0,
      total: 0,
      message: 'Ingen oppdateringer tilgjengelig',
    });
    return {
      success: true,
      chaptersUpdated: 0,
      newVersion: updates.currentVersion,
    };
  }

  const db = await getOfflineDb();
  let chaptersUpdated = 0;

  // Sync chapters in batches
  if (updates.changedChapters.length > 0) {
    const batches = chunkArray(updates.changedChapters, 10);
    let processed = 0;

    for (const batch of batches) {
      onProgress?.({
        phase: 'chapters',
        current: processed,
        total: updates.changedChapters.length,
        message: `Oppdaterer kapitler (${processed}/${updates.changedChapters.length})...`,
      });

      try {
        const response = await fetch('/api/sync/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapters: batch, bible }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: SyncChaptersResponse = await response.json();

        // Store each chapter
        for (const [key, chapter] of Object.entries(data.chapters)) {
          const storedChapter: StoredChapter = {
            bookId: chapter.bookId,
            chapter: chapter.chapter,
            bible: chapter.bible,
            verses: chapter.verses,
            originalVerses: chapter.originalVerses,
            word4word: chapter.word4word,
            references: chapter.references,
            summary: chapter.summary,
            context: chapter.context,
            insight: chapter.insight,
            cachedAt: chapter.cachedAt,
          };

          await db.put('chapters', storedChapter);
          chaptersUpdated++;
        }

        processed += batch.length;
      } catch (error) {
        console.error('[Sync] Failed to sync chapter batch:', error);
        // Continue with next batch
      }
    }
  }

  // Sync timeline if changed
  if (updates.timelineChanged) {
    onProgress?.({
      phase: 'timeline',
      current: 0,
      total: 1,
      message: 'Oppdaterer tidslinje...',
    });

    try {
      const response = await fetch('/api/timeline');
      if (response.ok) {
        const timelineData = await response.json();
        await db.put('timeline', {
          ...timelineData,
          cachedAt: Date.now(),
        }, 'data');
      }
    } catch (error) {
      console.error('[Sync] Failed to sync timeline:', error);
    }
  }

  // Sync prophecies if changed
  if (updates.propheciesChanged) {
    onProgress?.({
      phase: 'prophecies',
      current: 0,
      total: 1,
      message: 'Oppdaterer profetier...',
    });

    try {
      const response = await fetch('/api/prophecies');
      if (response.ok) {
        const propheciesData = await response.json();
        await db.put('prophecies', {
          ...propheciesData,
          cachedAt: Date.now(),
        }, 'data');
      }
    } catch (error) {
      console.error('[Sync] Failed to sync prophecies:', error);
    }
  }

  // Sync persons if changed
  if (updates.changedPersons.length > 0) {
    let processed = 0;
    for (const personId of updates.changedPersons) {
      onProgress?.({
        phase: 'persons',
        current: processed,
        total: updates.changedPersons.length,
        message: `Oppdaterer personer (${processed}/${updates.changedPersons.length})...`,
      });

      try {
        const response = await fetch(`/api/persons/${personId}`);
        if (response.ok) {
          const personData = await response.json();
          await db.put('persons', personData);
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync person ${personId}:`, error);
      }
      processed++;
    }
  }

  // Sync reading plans if changed
  if (updates.changedReadingPlans.length > 0) {
    let processed = 0;
    for (const planId of updates.changedReadingPlans) {
      onProgress?.({
        phase: 'plans',
        current: processed,
        total: updates.changedReadingPlans.length,
        message: `Oppdaterer leseplaner (${processed}/${updates.changedReadingPlans.length})...`,
      });

      try {
        const response = await fetch(`/api/reading-plans/${planId}`);
        if (response.ok) {
          const planData = await response.json();
          await db.put('readingPlans', planData);
        }
      } catch (error) {
        console.error(`[Sync] Failed to sync reading plan ${planId}:`, error);
      }
      processed++;
    }
  }

  // Update local sync version
  await setLocalSyncVersion(updates.currentVersion);

  onProgress?.({
    phase: 'complete',
    current: chaptersUpdated,
    total: chaptersUpdated,
    message: `Oppdatering fullført (${chaptersUpdated} kapitler)`,
  });

  return {
    success: true,
    chaptersUpdated,
    newVersion: updates.currentVersion,
  };
}

/**
 * Get total pending update count
 */
export async function getPendingUpdateCount(): Promise<number> {
  const updates = await checkForUpdates();
  return (
    updates.changedChapters.length +
    (updates.timelineChanged ? 1 : 0) +
    (updates.propheciesChanged ? 1 : 0) +
    updates.changedPersons.length +
    updates.changedReadingPlans.length
  );
}
