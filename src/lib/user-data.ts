// Export/import user data functionality
import type { BibleSettings } from './settings';
import type { FavoriteVerse } from '@/components/FavoritesContext';
import type { Topic, VerseTopic } from '@/components/TopicsContext';
import type { Note } from '@/components/NotesContext';
import type { ReadingPlanProgress } from './reading-plan';

export interface TopicsData {
  topics: Topic[];
  verseTopics: VerseTopic[];
}

export interface UserDataExport {
  version: 1;
  exportedAt: string;
  data: {
    settings?: BibleSettings;
    favorites?: FavoriteVerse[];
    topics?: TopicsData;
    notes?: Note[];
    readingPlanProgress?: Record<string, ReadingPlanProgress>;
    activeReadingPlan?: string | null;
  };
}

const STORAGE_KEYS = {
  settings: 'bible-settings',
  favorites: 'bible-favorites',
  topics: 'bible-topics',
  notes: 'bible-notes',
  readingPlanProgress: 'readingPlanProgress',
  activeReadingPlan: 'activeReadingPlan',
} as const;

/**
 * Export all user data from localStorage
 */
export function exportUserData(): UserDataExport {
  if (typeof window === 'undefined') {
    return { version: 1, exportedAt: new Date().toISOString(), data: {} };
  }

  const data: UserDataExport['data'] = {};

  try {
    // Settings
    const settingsStr = localStorage.getItem(STORAGE_KEYS.settings);
    if (settingsStr) {
      data.settings = JSON.parse(settingsStr);
    }

    // Favorites
    const favoritesStr = localStorage.getItem(STORAGE_KEYS.favorites);
    if (favoritesStr) {
      data.favorites = JSON.parse(favoritesStr);
    }

    // Topics
    const topicsStr = localStorage.getItem(STORAGE_KEYS.topics);
    if (topicsStr) {
      data.topics = JSON.parse(topicsStr);
    }

    // Notes
    const notesStr = localStorage.getItem(STORAGE_KEYS.notes);
    if (notesStr) {
      data.notes = JSON.parse(notesStr);
    }

    // Reading plan progress
    const progressStr = localStorage.getItem(STORAGE_KEYS.readingPlanProgress);
    if (progressStr) {
      data.readingPlanProgress = JSON.parse(progressStr);
    }

    // Active reading plan
    const activePlan = localStorage.getItem(STORAGE_KEYS.activeReadingPlan);
    data.activeReadingPlan = activePlan;
  } catch (e) {
    console.error('Failed to export user data:', e);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Import user data into localStorage
 * @param data The exported data to import
 * @param merge If true, merge with existing data instead of overwriting
 */
export function importUserData(data: UserDataExport, merge = false): void {
  if (typeof window === 'undefined') return;

  // Validate version
  if (data.version !== 1) {
    throw new Error(`Ukjent dataversjon: ${data.version}`);
  }

  try {
    // Settings - always overwrite (merge doesn't make sense for settings)
    if (data.data.settings) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data.data.settings));
    }

    // Favorites
    if (data.data.favorites) {
      if (merge) {
        const existingStr = localStorage.getItem(STORAGE_KEYS.favorites);
        const existing: FavoriteVerse[] = existingStr ? JSON.parse(existingStr) : [];
        const merged = [...existing];

        for (const fav of data.data.favorites) {
          const exists = merged.some(
            f => f.bookId === fav.bookId && f.chapter === fav.chapter && f.verse === fav.verse
          );
          if (!exists) {
            merged.push(fav);
          }
        }
        localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(data.data.favorites));
      }
    }

    // Topics
    if (data.data.topics) {
      if (merge) {
        const existingStr = localStorage.getItem(STORAGE_KEYS.topics);
        const existing: TopicsData = existingStr
          ? JSON.parse(existingStr)
          : { topics: [], verseTopics: [] };

        // Merge topics (by ID)
        const topicIdMap = new Map<string, string>(); // old ID -> new/existing ID
        for (const topic of data.data.topics.topics) {
          const existingTopic = existing.topics.find(t => t.name.toLowerCase() === topic.name.toLowerCase());
          if (existingTopic) {
            topicIdMap.set(topic.id, existingTopic.id);
          } else {
            existing.topics.push(topic);
            topicIdMap.set(topic.id, topic.id);
          }
        }

        // Merge verseTopics with mapped topic IDs
        for (const vt of data.data.topics.verseTopics) {
          const mappedTopicId = topicIdMap.get(vt.topicId) || vt.topicId;
          const exists = existing.verseTopics.some(
            evt => evt.bookId === vt.bookId && evt.chapter === vt.chapter &&
                   evt.verse === vt.verse && evt.topicId === mappedTopicId
          );
          if (!exists) {
            existing.verseTopics.push({ ...vt, topicId: mappedTopicId });
          }
        }

        localStorage.setItem(STORAGE_KEYS.topics, JSON.stringify(existing));
      } else {
        localStorage.setItem(STORAGE_KEYS.topics, JSON.stringify(data.data.topics));
      }
    }

    // Notes
    if (data.data.notes) {
      if (merge) {
        const existingStr = localStorage.getItem(STORAGE_KEYS.notes);
        const existing: Note[] = existingStr ? JSON.parse(existingStr) : [];

        // Merge notes by ID - imported notes with same ID overwrite existing
        const existingIds = new Set(existing.map(n => n.id));
        const merged = [...existing];

        for (const note of data.data.notes) {
          if (existingIds.has(note.id)) {
            // Update existing note if imported is newer
            const existingIndex = merged.findIndex(n => n.id === note.id);
            if (existingIndex !== -1 && note.updatedAt > merged[existingIndex].updatedAt) {
              merged[existingIndex] = note;
            }
          } else {
            merged.push(note);
          }
        }

        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(data.data.notes));
      }
    }

    // Reading plan progress
    if (data.data.readingPlanProgress) {
      if (merge) {
        const existingStr = localStorage.getItem(STORAGE_KEYS.readingPlanProgress);
        const existing: Record<string, ReadingPlanProgress> = existingStr ? JSON.parse(existingStr) : {};
        // Merge: imported data overwrites existing for same plan
        const merged = { ...existing, ...data.data.readingPlanProgress };
        localStorage.setItem(STORAGE_KEYS.readingPlanProgress, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEYS.readingPlanProgress, JSON.stringify(data.data.readingPlanProgress));
      }
    }

    // Active reading plan
    if (data.data.activeReadingPlan !== undefined) {
      if (data.data.activeReadingPlan) {
        localStorage.setItem(STORAGE_KEYS.activeReadingPlan, data.data.activeReadingPlan);
      } else if (!merge) {
        localStorage.removeItem(STORAGE_KEYS.activeReadingPlan);
      }
    }
  } catch (e) {
    console.error('Failed to import user data:', e);
    throw new Error('Kunne ikke importere data. Ugyldig filformat.');
  }
}

/**
 * Download user data as a JSON file
 */
export function downloadUserData(): void {
  const data = exportUserData();
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

/**
 * Validate that data is a valid UserDataExport
 */
export function validateUserDataExport(data: unknown): data is UserDataExport {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (typeof obj.data !== 'object' || obj.data === null) return false;

  return true;
}

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
    if (topicCount > 0 || verseCount > 0) {
      summary.push(`${topicCount} emner med ${verseCount} vers-tilknytninger`);
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

  return summary;
}
