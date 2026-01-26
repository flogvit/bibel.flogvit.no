import {
  getOfflineDb,
  StoredBook,
  StoredChapter,
  StoredReference,
  ReadingPlanData,
  CacheMetadata,
  StoredTimelineData,
  StoredProphecyData,
  StoredPersonData,
} from './db';

// ============================================
// User Data Operations
// ============================================

export async function getUserData<T>(key: string): Promise<T | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('userData', key);
    return result ? (result.data as T) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

export async function setUserData<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('userData', {
      key,
      data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to set user data:', error);
  }
}

export async function deleteUserData(key: string): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.delete('userData', key);
  } catch (error) {
    console.error('Failed to delete user data:', error);
  }
}

export async function getAllUserDataKeys(): Promise<string[]> {
  try {
    const db = await getOfflineDb();
    return db.getAllKeys('userData');
  } catch (error) {
    console.error('Failed to get user data keys:', error);
    return [];
  }
}

// ============================================
// Books Operations
// ============================================

export async function getStoredBook(bookId: number): Promise<StoredBook | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('books', bookId);
    return result || null;
  } catch (error) {
    console.error('Failed to get stored book:', error);
    return null;
  }
}

export async function getAllStoredBooks(): Promise<StoredBook[]> {
  try {
    const db = await getOfflineDb();
    return db.getAll('books');
  } catch (error) {
    console.error('Failed to get all stored books:', error);
    return [];
  }
}

export async function storeBook(book: StoredBook): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('books', book);
  } catch (error) {
    console.error('Failed to store book:', error);
  }
}

export async function storeBooks(books: StoredBook[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    const tx = db.transaction('books', 'readwrite');
    await Promise.all([
      ...books.map(book => tx.store.put(book)),
      tx.done,
    ]);
  } catch (error) {
    console.error('Failed to store books:', error);
  }
}

// ============================================
// Chapter Operations
// ============================================

export async function getStoredChapter(
  bookId: number,
  chapter: number,
  bible: string
): Promise<StoredChapter | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('chapters', [bookId, chapter, bible]);
    return result || null;
  } catch (error) {
    console.error('Failed to get stored chapter:', error);
    return null;
  }
}

export async function storeChapter(chapter: StoredChapter): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('chapters', chapter);

    // Update cache metadata
    await updateCacheMetadata(`chapter:${chapter.bookId}:${chapter.chapter}:${chapter.bible}`);
  } catch (error) {
    console.error('Failed to store chapter:', error);
  }
}

export async function getChaptersForBook(
  bookId: number,
  bible?: string
): Promise<StoredChapter[]> {
  try {
    const db = await getOfflineDb();
    const chapters = await db.getAllFromIndex('chapters', 'by-book', bookId);

    if (bible) {
      return chapters.filter(ch => ch.bible === bible);
    }
    return chapters;
  } catch (error) {
    console.error('Failed to get chapters for book:', error);
    return [];
  }
}

export async function getAllCachedChapters(bible?: string): Promise<StoredChapter[]> {
  try {
    const db = await getOfflineDb();

    if (bible) {
      return db.getAllFromIndex('chapters', 'by-bible', bible);
    }
    return db.getAll('chapters');
  } catch (error) {
    console.error('Failed to get all cached chapters:', error);
    return [];
  }
}

export async function deleteChapter(
  bookId: number,
  chapter: number,
  bible: string
): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.delete('chapters', [bookId, chapter, bible]);
    await deleteCacheMetadata(`chapter:${bookId}:${chapter}:${bible}`);
  } catch (error) {
    console.error('Failed to delete chapter:', error);
  }
}

export async function deleteAllChapters(): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.clear('chapters');

    // Clear all chapter-related cache metadata
    const allMetadata = await db.getAll('cacheMetadata');
    const tx = db.transaction('cacheMetadata', 'readwrite');
    for (const meta of allMetadata) {
      if (meta.key.startsWith('chapter:')) {
        await tx.store.delete(meta.key);
      }
    }
    await tx.done;
  } catch (error) {
    console.error('Failed to delete all chapters:', error);
  }
}

// ============================================
// References Operations
// ============================================

export async function getStoredReferences(
  bookId: number,
  chapter: number,
  verse: number
): Promise<StoredReference | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('references', [bookId, chapter, verse]);
    return result || null;
  } catch (error) {
    console.error('Failed to get stored references:', error);
    return null;
  }
}

export async function storeReferences(refs: StoredReference): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('references', refs);
  } catch (error) {
    console.error('Failed to store references:', error);
  }
}

export async function getReferencesForChapter(
  bookId: number,
  chapter: number
): Promise<StoredReference[]> {
  try {
    const db = await getOfflineDb();
    return db.getAllFromIndex('references', 'by-book-chapter', [bookId, chapter]);
  } catch (error) {
    console.error('Failed to get references for chapter:', error);
    return [];
  }
}

// ============================================
// Reading Plans Operations
// ============================================

export async function getStoredReadingPlan(id: string): Promise<ReadingPlanData | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('readingPlans', id);
    return result || null;
  } catch (error) {
    console.error('Failed to get stored reading plan:', error);
    return null;
  }
}

export async function getAllStoredReadingPlans(): Promise<ReadingPlanData[]> {
  try {
    const db = await getOfflineDb();
    return db.getAll('readingPlans');
  } catch (error) {
    console.error('Failed to get all stored reading plans:', error);
    return [];
  }
}

export async function storeReadingPlan(plan: ReadingPlanData): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('readingPlans', plan);
  } catch (error) {
    console.error('Failed to store reading plan:', error);
  }
}

export async function storeReadingPlans(plans: ReadingPlanData[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    const tx = db.transaction('readingPlans', 'readwrite');
    await Promise.all([
      ...plans.map(plan => tx.store.put(plan)),
      tx.done,
    ]);
  } catch (error) {
    console.error('Failed to store reading plans:', error);
  }
}

// ============================================
// Cache Metadata Operations
// ============================================

export async function getCacheMetadata(key: string): Promise<CacheMetadata | null> {
  try {
    const db = await getOfflineDb();
    const result = await db.get('cacheMetadata', key);
    return result || null;
  } catch (error) {
    console.error('Failed to get cache metadata:', error);
    return null;
  }
}

export async function updateCacheMetadata(key: string, size?: number): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.put('cacheMetadata', {
      key,
      cachedAt: Date.now(),
      size,
    });
  } catch (error) {
    console.error('Failed to update cache metadata:', error);
  }
}

export async function deleteCacheMetadata(key: string): Promise<void> {
  try {
    const db = await getOfflineDb();
    await db.delete('cacheMetadata', key);
  } catch (error) {
    console.error('Failed to delete cache metadata:', error);
  }
}

export async function getAllCacheMetadata(): Promise<CacheMetadata[]> {
  try {
    const db = await getOfflineDb();
    return db.getAll('cacheMetadata');
  } catch (error) {
    console.error('Failed to get all cache metadata:', error);
    return [];
  }
}

// ============================================
// Cache Statistics
// ============================================

export interface CacheStats {
  chaptersCount: number;
  booksCount: number;
  referencesCount: number;
  cachedBibles: string[];
  cachedChaptersByBible: Record<string, number>;
  totalSize?: number;
}

export async function getCacheStats(): Promise<CacheStats> {
  try {
    const db = await getOfflineDb();

    const chapters = await db.getAll('chapters');
    const books = await db.getAll('books');
    const metadata = await db.getAll('cacheMetadata');

    // Count chapters by bible
    const cachedChaptersByBible: Record<string, number> = {};
    const cachedBibles = new Set<string>();

    for (const chapter of chapters) {
      cachedBibles.add(chapter.bible);
      cachedChaptersByBible[chapter.bible] = (cachedChaptersByBible[chapter.bible] || 0) + 1;
    }

    // Count references
    const referencesCount = await db.count('references');

    // Calculate total size from metadata
    const totalSize = metadata.reduce((sum, m) => sum + (m.size || 0), 0);

    return {
      chaptersCount: chapters.length,
      booksCount: books.length,
      referencesCount,
      cachedBibles: Array.from(cachedBibles),
      cachedChaptersByBible,
      totalSize: totalSize > 0 ? totalSize : undefined,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      chaptersCount: 0,
      booksCount: 0,
      referencesCount: 0,
      cachedBibles: [],
      cachedChaptersByBible: {},
    };
  }
}

// ============================================
// Utility Functions
// ============================================

export async function isChapterCached(
  bookId: number,
  chapter: number,
  bible: string
): Promise<boolean> {
  const cached = await getStoredChapter(bookId, chapter, bible);
  return cached !== null;
}

export async function getCachedChaptersList(bible: string): Promise<{ bookId: number; chapter: number }[]> {
  const chapters = await getAllCachedChapters(bible);
  return chapters.map(ch => ({ bookId: ch.bookId, chapter: ch.chapter }));
}

// ============================================
// Timeline Operations
// ============================================

export async function getStoredTimeline(): Promise<StoredTimelineData | null> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('timeline')) return null;
    const result = await db.get('timeline', 'data');
    return result || null;
  } catch (error) {
    console.error('Failed to get stored timeline:', error);
    return null;
  }
}

export async function storeTimeline(data: StoredTimelineData): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('timeline')) {
      console.warn('Timeline store not available - database may need upgrade');
      return;
    }
    await db.put('timeline', data, 'data');
    await updateCacheMetadata('timeline');
  } catch (error) {
    console.error('Failed to store timeline:', error);
  }
}

export async function deleteTimeline(): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('timeline')) return;
    await db.delete('timeline', 'data');
    await deleteCacheMetadata('timeline');
  } catch (error) {
    console.error('Failed to delete timeline:', error);
  }
}

// ============================================
// Prophecies Operations
// ============================================

export async function getStoredProphecies(): Promise<StoredProphecyData | null> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('prophecies')) return null;
    const result = await db.get('prophecies', 'data');
    return result || null;
  } catch (error) {
    console.error('Failed to get stored prophecies:', error);
    return null;
  }
}

export async function storeProphecies(data: StoredProphecyData): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('prophecies')) {
      console.warn('Prophecies store not available - database may need upgrade');
      return;
    }
    await db.put('prophecies', data, 'data');
    await updateCacheMetadata('prophecies');
  } catch (error) {
    console.error('Failed to store prophecies:', error);
  }
}

export async function deleteProphecies(): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('prophecies')) return;
    await db.delete('prophecies', 'data');
    await deleteCacheMetadata('prophecies');
  } catch (error) {
    console.error('Failed to delete prophecies:', error);
  }
}

// ============================================
// Persons Operations
// ============================================

export async function getStoredPerson(id: string): Promise<StoredPersonData | null> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('persons')) return null;
    const result = await db.get('persons', id);
    return result || null;
  } catch (error) {
    console.error('Failed to get stored person:', error);
    return null;
  }
}

export async function getAllStoredPersons(): Promise<StoredPersonData[]> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('persons')) return [];
    return db.getAll('persons');
  } catch (error) {
    console.error('Failed to get all stored persons:', error);
    return [];
  }
}

export async function storePerson(person: StoredPersonData): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('persons')) {
      console.warn('Persons store not available - database may need upgrade');
      return;
    }
    await db.put('persons', person);
  } catch (error) {
    console.error('Failed to store person:', error);
  }
}

export async function storePersons(persons: StoredPersonData[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('persons')) {
      console.warn('Persons store not available - database may need upgrade');
      return;
    }
    const tx = db.transaction('persons', 'readwrite');
    await Promise.all([
      ...persons.map(person => tx.store.put(person)),
      tx.done,
    ]);
    await updateCacheMetadata('persons');
  } catch (error) {
    console.error('Failed to store persons:', error);
  }
}

export async function deleteAllPersons(): Promise<void> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('persons')) return;
    await db.clear('persons');
    await deleteCacheMetadata('persons');
  } catch (error) {
    console.error('Failed to delete all persons:', error);
  }
}

// ============================================
// Supporting Data Status
// ============================================

export interface SupportingDataStatus {
  hasTimeline: boolean;
  hasProphecies: boolean;
  personsCount: number;
  readingPlansCount: number;
}

export async function getSupportingDataStatus(): Promise<SupportingDataStatus> {
  try {
    const db = await getOfflineDb();

    // Check if the new stores exist (they were added in DB version 2)
    const storeNames = db.objectStoreNames;
    const hasTimelineStore = storeNames.contains('timeline');
    const hasPropheciesStore = storeNames.contains('prophecies');
    const hasPersonsStore = storeNames.contains('persons');

    let timeline = null;
    let prophecies = null;
    let personsCount = 0;
    let readingPlansCount = 0;

    // Only access stores that exist
    if (hasTimelineStore) {
      timeline = await db.get('timeline', 'data');
    }
    if (hasPropheciesStore) {
      prophecies = await db.get('prophecies', 'data');
    }
    if (hasPersonsStore) {
      personsCount = await db.count('persons');
    }
    if (storeNames.contains('readingPlans')) {
      readingPlansCount = await db.count('readingPlans');
    }

    return {
      hasTimeline: !!timeline,
      hasProphecies: !!prophecies,
      personsCount,
      readingPlansCount,
    };
  } catch (error) {
    console.error('Failed to get supporting data status:', error);
    return {
      hasTimeline: false,
      hasProphecies: false,
      personsCount: 0,
      readingPlansCount: 0,
    };
  }
}

// ============================================
// Clear All Supporting Data
// ============================================

export async function deleteAllSupportingData(): Promise<void> {
  try {
    await deleteTimeline();
    await deleteProphecies();
    await deleteAllPersons();
    // Keep reading plans as they might have user progress
  } catch (error) {
    console.error('Failed to delete all supporting data:', error);
  }
}
