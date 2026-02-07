// Export/import user data functionality
// Reads/writes via IndexedDB (primary) with localStorage sync
import type { StoredUserBible, StoredChapter } from './offline/db';
import {
  getFavorites, saveFavorites,
  getNotes, saveNotes,
  getTopics, saveTopics,
  getSettings, saveSettings,
  getActivePlanId, setActivePlanId,
  getAllPlanProgress, savePlanProgress,
  getReadingPosition, saveReadingPosition,
  getVerseVersions, saveVerseVersions,
  getVerseLists, saveVerseLists,
  type FavoriteVerse, type Topic, type VerseTopic, type ItemTopic,
  type Note, type ReadingPosition, type VerseVersionChoices,
  type TopicsData, type BibleSettings, type VerseList,
} from './offline/userData';
import type { ReadingPlanProgress } from './reading-plan';
import { getUserBibles, addUserBible, storeUserBibleChapters } from './offline/userBibles';
import { getAllCachedChapters } from './offline/storage';

// ============================================
// Export format types
// ============================================

// Version 1: Original localStorage-only format
interface UserDataV1 {
  version: 1;
  exportedAt: string;
  data: {
    settings?: BibleSettings;
    favorites?: FavoriteVerse[];
    topics?: { topics: Topic[]; verseTopics: VerseTopic[] };
    notes?: Note[];
    readingPlanProgress?: Record<string, ReadingPlanProgress>;
    activeReadingPlan?: string | null;
    readingPosition?: ReadingPosition | null;
    verseVersions?: VerseVersionChoices;
  };
}

// Version 2: Full IndexedDB support + user bibles + itemTopics
interface UserDataV2 {
  version: 2;
  exportedAt: string;
  data: {
    settings?: BibleSettings;
    favorites?: FavoriteVerse[];
    topics?: { topics: Topic[]; verseTopics: VerseTopic[]; itemTopics: ItemTopic[] };
    notes?: Note[];
    readingPlanProgress?: Record<string, ReadingPlanProgress>;
    activeReadingPlan?: string | null;
    readingPosition?: ReadingPosition | null;
    verseVersions?: VerseVersionChoices;
    verseLists?: VerseList[];
    userBibles?: ExportedUserBible[];
  };
}

interface ExportedUserBible {
  meta: StoredUserBible;
  chapters: StoredChapter[];
}

// Union type for all supported versions
export type UserDataExport = UserDataV1 | UserDataV2;

// Current export version
const CURRENT_VERSION = 2;

// ============================================
// Export
// ============================================

/**
 * Export all user data from IndexedDB
 */
export async function exportUserData(): Promise<UserDataV2> {
  if (typeof window === 'undefined') {
    return { version: CURRENT_VERSION, exportedAt: new Date().toISOString(), data: {} };
  }

  const data: UserDataV2['data'] = {};

  try {
    const settings = await getSettings();
    // Only include if different from defaults (settings always returns merged with defaults)
    data.settings = settings;

    const favorites = await getFavorites();
    if (favorites.length > 0) data.favorites = favorites;

    const topicsData = await getTopics();
    if (topicsData.topics.length > 0 || topicsData.verseTopics.length > 0 || topicsData.itemTopics.length > 0) {
      data.topics = topicsData;
    }

    const notes = await getNotes();
    if (notes.length > 0) data.notes = notes;

    const planProgress = await getAllPlanProgress();
    if (Object.keys(planProgress).length > 0) data.readingPlanProgress = planProgress;

    const activePlan = await getActivePlanId();
    if (activePlan) data.activeReadingPlan = activePlan;

    const readingPos = await getReadingPosition();
    if (readingPos) data.readingPosition = readingPos;

    const verseVersions = await getVerseVersions();
    if (Object.keys(verseVersions).length > 0) data.verseVersions = verseVersions;

    const verseLists = await getVerseLists();
    if (verseLists.length > 0) data.verseLists = verseLists;

    // User-uploaded bibles (metadata + all chapters)
    const userBibles = await getUserBibles();
    if (userBibles.length > 0) {
      const exportedBibles: ExportedUserBible[] = [];
      for (const bible of userBibles) {
        const chapters = await getAllCachedChapters(bible.id);
        exportedBibles.push({ meta: bible, chapters });
      }
      data.userBibles = exportedBibles;
    }
  } catch (e) {
    console.error('Failed to export user data:', e);
  }

  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

// ============================================
// Import
// ============================================

/**
 * Import user data into IndexedDB + localStorage
 * Supports version 1 and 2 formats
 */
export async function importUserData(data: UserDataExport, merge = false): Promise<void> {
  if (typeof window === 'undefined') return;

  if (data.version === 1) {
    await importV1(data, merge);
  } else if (data.version === 2) {
    await importV2(data, merge);
  } else {
    throw new Error(`Ukjent dataversjon: ${(data as { version: number }).version}`);
  }
}

/**
 * Import version 1 format (convert to v2 internally)
 */
async function importV1(data: UserDataV1, merge: boolean): Promise<void> {
  // Convert v1 topics to v2 format (add empty itemTopics)
  const v2Topics = data.data.topics
    ? { ...data.data.topics, itemTopics: [] as ItemTopic[] }
    : undefined;

  const v2Data: UserDataV2 = {
    version: 2,
    exportedAt: data.exportedAt,
    data: {
      ...data.data,
      topics: v2Topics,
    },
  };

  await importV2(v2Data, merge);
}

/**
 * Import version 2 format
 */
async function importV2(data: UserDataV2, merge: boolean): Promise<void> {
  try {
    // Settings - always overwrite
    if (data.data.settings) {
      await saveSettings(data.data.settings);
    }

    // Favorites
    if (data.data.favorites) {
      if (merge) {
        const existing = await getFavorites();
        const merged = [...existing];
        for (const fav of data.data.favorites) {
          const exists = merged.some(
            f => f.bookId === fav.bookId && f.chapter === fav.chapter && f.verse === fav.verse
          );
          if (!exists) merged.push(fav);
        }
        await saveFavorites(merged);
      } else {
        await saveFavorites(data.data.favorites);
      }
    }

    // Topics
    if (data.data.topics) {
      if (merge) {
        const existing = await getTopics();

        // Merge topic definitions (by name)
        const topicIdMap = new Map<string, string>();
        for (const topic of data.data.topics.topics) {
          const existingTopic = existing.topics.find(t => t.name.toLowerCase() === topic.name.toLowerCase());
          if (existingTopic) {
            topicIdMap.set(topic.id, existingTopic.id);
          } else {
            existing.topics.push(topic);
            topicIdMap.set(topic.id, topic.id);
          }
        }

        // Merge legacy verseTopics
        for (const vt of data.data.topics.verseTopics || []) {
          const mappedTopicId = topicIdMap.get(vt.topicId) || vt.topicId;
          const exists = existing.verseTopics.some(
            evt => evt.bookId === vt.bookId && evt.chapter === vt.chapter &&
                   evt.verse === vt.verse && evt.topicId === mappedTopicId
          );
          if (!exists) {
            existing.verseTopics.push({ ...vt, topicId: mappedTopicId });
          }
        }

        // Merge itemTopics
        for (const it of data.data.topics.itemTopics || []) {
          const mappedTopicId = topicIdMap.get(it.topicId) || it.topicId;
          const exists = existing.itemTopics.some(
            eit => eit.itemType === it.itemType && eit.itemId === it.itemId && eit.topicId === mappedTopicId
          );
          if (!exists) {
            existing.itemTopics.push({ ...it, topicId: mappedTopicId });
          }
        }

        await saveTopics(existing);
      } else {
        await saveTopics({
          topics: data.data.topics.topics || [],
          verseTopics: data.data.topics.verseTopics || [],
          itemTopics: data.data.topics.itemTopics || [],
        });
      }
    }

    // Notes
    if (data.data.notes) {
      if (merge) {
        const existing = await getNotes();
        const existingIds = new Set(existing.map(n => n.id));
        const merged = [...existing];

        for (const note of data.data.notes) {
          if (existingIds.has(note.id)) {
            const idx = merged.findIndex(n => n.id === note.id);
            if (idx !== -1 && note.updatedAt > merged[idx].updatedAt) {
              merged[idx] = note;
            }
          } else {
            merged.push(note);
          }
        }
        await saveNotes(merged);
      } else {
        await saveNotes(data.data.notes);
      }
    }

    // Reading plan progress
    if (data.data.readingPlanProgress) {
      if (merge) {
        const existing = await getAllPlanProgress();
        await savePlanProgress({ ...existing, ...data.data.readingPlanProgress });
      } else {
        await savePlanProgress(data.data.readingPlanProgress);
      }
    }

    // Active reading plan
    if (data.data.activeReadingPlan !== undefined) {
      if (data.data.activeReadingPlan) {
        await setActivePlanId(data.data.activeReadingPlan);
      } else if (!merge) {
        await setActivePlanId(null);
      }
    }

    // Reading position
    if (data.data.readingPosition !== undefined) {
      if (data.data.readingPosition) {
        await saveReadingPosition(data.data.readingPosition);
      } else if (!merge) {
        await saveReadingPosition(null);
      }
    }

    // Verse versions
    if (data.data.verseVersions) {
      if (merge) {
        const existing = await getVerseVersions();
        await saveVerseVersions({ ...existing, ...data.data.verseVersions });
      } else {
        await saveVerseVersions(data.data.verseVersions);
      }
    }

    // Verse lists
    if (data.data.verseLists) {
      if (merge) {
        const existing = await getVerseLists();
        const existingIds = new Set(existing.map(l => l.id));
        const merged = [...existing];

        for (const list of data.data.verseLists) {
          if (existingIds.has(list.id)) {
            const idx = merged.findIndex(l => l.id === list.id);
            if (idx !== -1 && list.updatedAt > merged[idx].updatedAt) {
              merged[idx] = list;
            }
          } else {
            merged.push(list);
          }
        }
        await saveVerseLists(merged);
      } else {
        await saveVerseLists(data.data.verseLists);
      }
    }

    // User bibles (v2 only)
    if (data.data.userBibles) {
      const existingBibles = await getUserBibles();
      const existingIds = new Set(existingBibles.map(b => b.id));

      for (const ub of data.data.userBibles) {
        if (merge && existingIds.has(ub.meta.id)) {
          // Skip existing bibles when merging
          continue;
        }
        await addUserBible(ub.meta);
        if (ub.chapters.length > 0) {
          await storeUserBibleChapters(ub.meta.id, ub.chapters);
        }
      }
    }
  } catch (e) {
    console.error('Failed to import user data:', e);
    throw new Error('Kunne ikke importere data. Ugyldig filformat.');
  }
}

// ============================================
// Download
// ============================================

/**
 * Download user data as a JSON file
 */
export async function downloadUserData(): Promise<void> {
  const data = await exportUserData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `bibel-data-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// Validation
// ============================================

/**
 * Validate that data is a valid UserDataExport (any supported version)
 */
export function validateUserDataExport(data: unknown): data is UserDataExport {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1 && obj.version !== 2) return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (typeof obj.data !== 'object' || obj.data === null) return false;

  return true;
}

// ============================================
// Import summary
// ============================================

/**
 * Get a summary of what data will be imported
 */
export function getImportSummary(data: UserDataExport): string[] {
  const summary: string[] = [];

  if (data.data.settings) {
    summary.push('Innstillinger');
  }

  if (data.data.favorites && data.data.favorites.length > 0) {
    summary.push(`${data.data.favorites.length} favorittvers`);
  }

  if (data.data.topics) {
    const topicCount = data.data.topics.topics?.length || 0;
    const verseCount = data.data.topics.verseTopics?.length || 0;
    const itemCount = ('itemTopics' in data.data.topics ? data.data.topics.itemTopics?.length : 0) || 0;
    const tagCount = verseCount + itemCount;
    if (topicCount > 0 || tagCount > 0) {
      summary.push(`${topicCount} emner med ${tagCount} tilknytninger`);
    }
  }

  if (data.data.notes && data.data.notes.length > 0) {
    summary.push(`${data.data.notes.length} notat${data.data.notes.length > 1 ? 'er' : ''}`);
  }

  if (data.data.readingPlanProgress) {
    const planCount = Object.keys(data.data.readingPlanProgress).length;
    if (planCount > 0) {
      summary.push(`Progresjon for ${planCount} leseplan${planCount > 1 ? 'er' : ''}`);
    }
  }

  if (data.data.activeReadingPlan) {
    summary.push('Aktiv leseplan');
  }

  if (data.data.readingPosition) {
    summary.push('Leseposisjon');
  }

  if (data.data.verseVersions) {
    const versionCount = Object.keys(data.data.verseVersions).length;
    if (versionCount > 0) {
      summary.push(`${versionCount} versvalg`);
    }
  }

  if (data.version === 2 && data.data.verseLists && data.data.verseLists.length > 0) {
    summary.push(`${data.data.verseLists.length} versliste${data.data.verseLists.length > 1 ? 'r' : ''}`);
  }

  if (data.version === 2 && data.data.userBibles && data.data.userBibles.length > 0) {
    const names = data.data.userBibles.map(ub => ub.meta.name).join(', ');
    summary.push(`${data.data.userBibles.length} bibel${data.data.userBibles.length > 1 ? 'oversettelser' : 'oversettelse'}: ${names}`);
  }

  return summary;
}
