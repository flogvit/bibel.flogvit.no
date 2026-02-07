import { getOfflineDb, StoredUserBible, StoredChapter, StoredBook } from './db';

export async function getUserBibles(): Promise<StoredUserBible[]> {
  try {
    const db = await getOfflineDb();
    if (!db.objectStoreNames.contains('userBibles')) return [];
    return db.getAll('userBibles');
  } catch (error) {
    console.error('Failed to get user bibles:', error);
    return [];
  }
}

export async function addUserBible(meta: StoredUserBible): Promise<void> {
  const db = await getOfflineDb();
  await db.put('userBibles', meta);
}

export async function deleteUserBible(id: string): Promise<void> {
  const db = await getOfflineDb();

  // Delete metadata
  await db.delete('userBibles', id);

  // Delete all chapters with this bible key
  const allChapters = await db.getAllFromIndex('chapters', 'by-bible', id);
  if (allChapters.length > 0) {
    const tx = db.transaction('chapters', 'readwrite');
    for (const ch of allChapters) {
      await tx.store.delete([ch.bookId, ch.chapter, ch.bible]);
    }
    await tx.done;
  }
}

export async function storeUserBibleChapters(
  bibleId: string,
  chapters: StoredChapter[]
): Promise<void> {
  const db = await getOfflineDb();
  const BATCH_SIZE = 100;

  for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
    const batch = chapters.slice(i, i + BATCH_SIZE);
    const tx = db.transaction('chapters', 'readwrite');
    await Promise.all([
      ...batch.map(ch => tx.store.put(ch)),
      tx.done,
    ]);
  }
}

export interface UserBibleSearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export async function searchUserBible(
  bibleId: string,
  query: string,
  limit = 50,
  offset = 0
): Promise<{ results: UserBibleSearchResult[]; total: number; hasMore: boolean }> {
  if (!query || query.length < 2) return { results: [], total: 0, hasMore: false };

  const db = await getOfflineDb();
  const lowerQuery = query.toLowerCase();

  // Get all chapters for this bible
  const allChapters = await db.getAllFromIndex('chapters', 'by-bible', bibleId);

  // Get book metadata - try IndexedDB first, fall back to API
  let books = await db.getAll('books');
  if (books.length === 0) {
    const res = await fetch('/api/books');
    const data = await res.json();
    books = data.books;
  }

  const bookMap = new Map<number, StoredBook>();
  for (const b of books) bookMap.set(b.id, b);

  // Collect all matching verses
  const allMatches: UserBibleSearchResult[] = [];
  for (const ch of allChapters) {
    const book = bookMap.get(ch.bookId);
    if (!book) continue;
    for (const v of ch.verses) {
      if (v.text.toLowerCase().includes(lowerQuery)) {
        allMatches.push({
          book_id: ch.bookId,
          book_name_no: book.name_no,
          book_short_name: book.short_name,
          chapter: ch.chapter,
          verse: v.verse,
          text: v.text,
        });
      }
    }
  }

  // Sort by book, chapter, verse
  allMatches.sort((a, b) =>
    a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse
  );

  const total = allMatches.length;
  const results = allMatches.slice(offset, offset + limit);
  return { results, total, hasMore: offset + results.length < total };
}
