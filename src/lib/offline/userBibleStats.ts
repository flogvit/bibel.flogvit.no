import { getOfflineDb, StoredBook } from './db';

interface BookStatistics {
  bookId: number;
  bookName: string;
  shortName: string;
  testament: string;
  chapters: number;
  verses: number;
  words: number;
  originalWords: number;
  originalLanguage: 'hebrew' | 'greek';
}

interface BibleStatistics {
  totalBooks: number;
  totalChapters: number;
  totalVerses: number;
  totalWords: number;
  totalOriginalWords: number;
  otBooks: number;
  otChapters: number;
  otVerses: number;
  otWords: number;
  ntBooks: number;
  ntChapters: number;
  ntVerses: number;
  ntWords: number;
  books: BookStatistics[];
}

interface WordFrequency {
  word: string;
  count: number;
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

async function getBookMap(): Promise<Map<number, StoredBook>> {
  const db = await getOfflineDb();
  let books = await db.getAll('books');
  if (books.length === 0) {
    const res = await fetch('/api/books');
    const data = await res.json();
    books = data.books;
  }
  const map = new Map<number, StoredBook>();
  for (const b of books) map.set(b.id, b);
  return map;
}

export async function getUserBibleStatistics(bibleId: string): Promise<BibleStatistics> {
  const db = await getOfflineDb();
  const allChapters = await db.getAllFromIndex('chapters', 'by-bible', bibleId);
  const bookMap = await getBookMap();

  // Group chapters by book
  const bookChapters = new Map<number, { chapters: Set<number>; verses: number; words: number }>();

  for (const ch of allChapters) {
    let entry = bookChapters.get(ch.bookId);
    if (!entry) {
      entry = { chapters: new Set(), verses: 0, words: 0 };
      bookChapters.set(ch.bookId, entry);
    }
    entry.chapters.add(ch.chapter);
    for (const v of ch.verses) {
      entry.verses++;
      entry.words += countWords(v.text);
    }
  }

  const bookStats: BookStatistics[] = [];
  let totalChapters = 0, totalVerses = 0, totalWords = 0;
  let otChapters = 0, otVerses = 0, otWords = 0;
  let ntChapters = 0, ntVerses = 0, ntWords = 0;
  let otBookCount = 0, ntBookCount = 0;

  // Sort by book ID for consistent ordering
  const sortedBookIds = [...bookChapters.keys()].sort((a, b) => a - b);

  for (const bookId of sortedBookIds) {
    const entry = bookChapters.get(bookId)!;
    const book = bookMap.get(bookId);
    const testament = book ? book.testament : (bookId <= 39 ? 'OT' : 'NT');

    bookStats.push({
      bookId,
      bookName: book?.name_no ?? `Bok ${bookId}`,
      shortName: book?.short_name ?? `${bookId}`,
      testament,
      chapters: entry.chapters.size,
      verses: entry.verses,
      words: entry.words,
      originalWords: 0,
      originalLanguage: bookId <= 39 ? 'hebrew' : 'greek',
    });

    totalChapters += entry.chapters.size;
    totalVerses += entry.verses;
    totalWords += entry.words;

    if (testament === 'OT') {
      otBookCount++;
      otChapters += entry.chapters.size;
      otVerses += entry.verses;
      otWords += entry.words;
    } else {
      ntBookCount++;
      ntChapters += entry.chapters.size;
      ntVerses += entry.verses;
      ntWords += entry.words;
    }
  }

  return {
    totalBooks: bookStats.length,
    totalChapters,
    totalVerses,
    totalWords,
    totalOriginalWords: 0,
    otBooks: otBookCount,
    otChapters,
    otVerses,
    otWords,
    ntBooks: ntBookCount,
    ntChapters,
    ntVerses,
    ntWords,
    books: bookStats,
  };
}

export async function getUserBibleTopWords(
  bibleId: string,
  limit = 100,
  includeStopWords = false,
): Promise<WordFrequency[]> {
  const db = await getOfflineDb();
  const allChapters = await db.getAllFromIndex('chapters', 'by-bible', bibleId);

  const stopWords = new Set([
    'og', 'i', 'til', 'som', 'for', 'med', 'den', 'det', 'de', 'en', 'et',
    'av', 'på', 'er', 'var', 'han', 'ham', 'hun', 'seg', 'skal', 'vil', 'har', 'ikke',
    'jeg', 'du', 'vi', 'dere', 'dem', 'sin', 'sine', 'sitt', 'fra', 'om', 'eller',
    'men', 'så', 'da', 'når', 'ble', 'blir', 'være', 'min', 'mitt', 'mine', 'din',
    'ditt', 'dine', 'dette', 'denne', 'disse', 'at', 'over', 'under', 'ut', 'inn',
    'opp', 'ned', 'mot', 'ved', 'etter', 'før', 'selv', 'alle', 'alt', 'noe', 'ingen',
    'hver', 'noen', 'andre', 'mange', 'hele', 'også', 'bare', 'kunne', 'skulle', 'ville',
    'måtte', 'må', 'kan', 'la', 'lot', 'oss', 'deg', 'der', 'her',
  ]);

  const wordCounts: Record<string, number> = {};

  for (const ch of allChapters) {
    for (const v of ch.verses) {
      if (!v.text) continue;
      const words = v.text
        .toLowerCase()
        .replace(/[.,;:!?»«"'"'\-–—()[\]{}]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && (includeStopWords || !stopWords.has(w)));

      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
  }

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
