/**
 * Offline Search Functionality
 *
 * Searches through cached chapters in IndexedDB.
 * Note: This only works for chapters that have been cached/downloaded.
 */

import { getOfflineDb, StoredChapter } from './db';

export interface OfflineSearchResult {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  bible: string;
}

export interface OfflineSearchResponse {
  results: OfflineSearchResult[];
  total: number;
  isOfflineSearch: true;
  cachedChaptersSearched: number;
}

/**
 * Search through cached chapters for matching text
 *
 * @param query - The search term
 * @param bible - Bible version to search (defaults to 'osnb2')
 * @param limit - Maximum number of results (defaults to 50)
 * @returns Search results from cached chapters only
 */
export async function searchOffline(
  query: string,
  bible = 'osnb2',
  limit = 50
): Promise<OfflineSearchResponse> {
  if (!query || query.length < 2) {
    return {
      results: [],
      total: 0,
      isOfflineSearch: true,
      cachedChaptersSearched: 0,
    };
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: OfflineSearchResult[] = [];
  let chaptersSearched = 0;

  try {
    const db = await getOfflineDb();
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('by-bible');

    // Use a cursor to iterate through all chapters for this bible version
    let cursor = await index.openCursor(IDBKeyRange.only(bible));

    while (cursor && results.length < limit) {
      const chapter: StoredChapter = cursor.value;
      chaptersSearched++;

      // Search through verses in this chapter
      for (const verse of chapter.verses) {
        if (verse.text.toLowerCase().includes(normalizedQuery)) {
          results.push({
            bookId: chapter.bookId,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
            bible: chapter.bible,
          });

          if (results.length >= limit) break;
        }
      }

      cursor = await cursor.continue();
    }

    return {
      results,
      total: results.length,
      isOfflineSearch: true,
      cachedChaptersSearched: chaptersSearched,
    };
  } catch (error) {
    console.error('Offline search failed:', error);
    return {
      results: [],
      total: 0,
      isOfflineSearch: true,
      cachedChaptersSearched: 0,
    };
  }
}

/**
 * Get the count of cached chapters for a bible version
 */
export async function getCachedChapterCount(bible: string): Promise<number> {
  try {
    const db = await getOfflineDb();
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('by-bible');

    let count = 0;
    let cursor = await index.openCursor(IDBKeyRange.only(bible));

    while (cursor) {
      count++;
      cursor = await cursor.continue();
    }

    return count;
  } catch (error) {
    console.error('Failed to get cached chapter count:', error);
    return 0;
  }
}

/**
 * Check if offline search is available (has cached chapters)
 */
export async function isOfflineSearchAvailable(bible = 'osnb2'): Promise<boolean> {
  const count = await getCachedChapterCount(bible);
  return count > 0;
}
