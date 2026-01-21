import { getDb } from './db';

// Re-export toUrlSlug for convenience (server-side usage)
export { toUrlSlug } from './url-utils';
import { toUrlSlug } from './url-utils';

export interface Book {
  id: number;
  name: string;
  name_no: string;
  short_name: string;
  testament: string;
  chapters: number;
}

export interface Verse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  bible: string;
}

export interface Word4Word {
  word_index: number;
  word: string;
  original: string | null;
  pronunciation: string | null;
  explanation: string | null;
}

export interface Reference {
  to_book_id: number;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  description: string | null;
  book_short_name?: string;
}

/**
 * Get URL slug for a book (ASCII-safe version of short_name)
 */
export function getBookUrlSlug(book: Book): string {
  return toUrlSlug(book.short_name);
}

export function getBookByShortName(shortName: string): Book | undefined {
  const db = getDb();
  const normalized = shortName.toLowerCase();

  // First try exact match
  let book = db.prepare(
    'SELECT * FROM books WHERE LOWER(short_name) = ?'
  ).get(normalized) as Book | undefined;

  if (book) return book;

  // Try matching with ASCII conversion (e.g., "ap" matches "Åp")
  const books = db.prepare('SELECT * FROM books').all() as Book[];
  return books.find(b => toUrlSlug(b.short_name) === normalized);
}

export function getBookById(id: number): Book | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
}

export function getAllBooks(): Book[] {
  const db = getDb();
  return db.prepare('SELECT * FROM books ORDER BY id').all() as Book[];
}

export function getVerses(bookId: number, chapter: number, bible = 'osnb1'): Verse[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM verses WHERE book_id = ? AND chapter = ? AND bible = ? ORDER BY verse'
  ).all(bookId, chapter, bible) as Verse[];
}

export function getOriginalVerses(bookId: number, chapter: number): Verse[] {
  const db = getDb();
  // GT (book 1-39) uses tanach (Hebrew), NT (book 40-66) uses sblgnt (Greek)
  const bible = bookId <= 39 ? 'tanach' : 'sblgnt';
  return db.prepare(
    'SELECT * FROM verses WHERE book_id = ? AND chapter = ? AND bible = ? ORDER BY verse'
  ).all(bookId, chapter, bible) as Verse[];
}

export function getOriginalLanguage(bookId: number): 'hebrew' | 'greek' {
  return bookId <= 39 ? 'hebrew' : 'greek';
}

export function getWord4Word(bookId: number, chapter: number, verse: number, bible = 'osnb1'): Word4Word[] {
  const db = getDb();
  return db.prepare(
    'SELECT word_index, word, original, pronunciation, explanation FROM word4word WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = ? ORDER BY word_index'
  ).all(bookId, chapter, verse, bible) as Word4Word[];
}

export function getOriginalWord4Word(bookId: number, chapter: number, verse: number): Word4Word[] {
  // GT (book 1-39) uses tanach (Hebrew), NT (book 40-66) uses sblgnt (Greek)
  const bible = bookId <= 39 ? 'tanach' : 'sblgnt';
  return getWord4Word(bookId, chapter, verse, bible);
}

export function getReferences(bookId: number, chapter: number, verse: number): Reference[] {
  const db = getDb();
  const refs = db.prepare(`
    SELECT r.*, b.short_name as book_short_name
    FROM references_ r
    JOIN books b ON r.to_book_id = b.id
    WHERE r.from_book_id = ? AND r.from_chapter = ? AND r.from_verse = ?
  `).all(bookId, chapter, verse) as Reference[];
  return refs;
}

export function getBookSummary(bookId: number): string | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT summary FROM book_summaries WHERE book_id = ?'
  ).get(bookId) as { summary: string } | undefined;
  return result?.summary ?? null;
}

export function getChapterSummary(bookId: number, chapter: number): string | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?'
  ).get(bookId, chapter) as { summary: string } | undefined;
  return result?.summary ?? null;
}

export function getImportantWords(bookId: number, chapter: number): { word: string; explanation: string }[] {
  const db = getDb();
  return db.prepare(
    'SELECT word, explanation FROM important_words WHERE book_id = ? AND chapter = ?'
  ).all(bookId, chapter) as { word: string; explanation: string }[];
}

export function getVersePrayer(bookId: number, chapter: number, verse: number): string | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT prayer FROM verse_prayers WHERE book_id = ? AND chapter = ? AND verse = ?'
  ).get(bookId, chapter, verse) as { prayer: string } | undefined;
  return result?.prayer ?? null;
}

export function getVerseSermon(bookId: number, chapter: number, verse: number): string | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT sermon FROM verse_sermons WHERE book_id = ? AND chapter = ? AND verse = ?'
  ).get(bookId, chapter, verse) as { sermon: string } | undefined;
  return result?.sermon ?? null;
}

export function formatReference(ref: Reference): string {
  const verseRange = ref.to_verse_start === ref.to_verse_end
    ? `${ref.to_verse_start}`
    : `${ref.to_verse_start}-${ref.to_verse_end}`;
  return `${ref.book_short_name} ${ref.to_chapter}:${verseRange}`;
}

export interface ImportantVerse {
  book_id: number;
  chapter: number;
  verse: number;
  text: string | null;
}

export function getImportantVersesForChapter(bookId: number, chapter: number): number[] {
  const db = getDb();
  const results = db.prepare(
    'SELECT verse FROM important_verses WHERE book_id = ? AND chapter = ?'
  ).all(bookId, chapter) as { verse: number }[];
  return results.map(r => r.verse);
}

export interface WellKnownVerse {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
  verse_text: string;
}

export function getAllWellKnownVerses(): WellKnownVerse[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      iv.book_id,
      b.name_no as book_name_no,
      b.short_name as book_short_name,
      iv.chapter,
      iv.verse,
      iv.text,
      v.text as verse_text
    FROM important_verses iv
    JOIN books b ON iv.book_id = b.id
    JOIN verses v ON iv.book_id = v.book_id AND iv.chapter = v.chapter AND iv.verse = v.verse AND v.bible = 'osnb1'
    ORDER BY iv.book_id, iv.chapter, iv.verse
  `).all() as WellKnownVerse[];
}

export interface SearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface Theme {
  id: number;
  name: string;
  content: string;
}

export interface ThemeItem {
  title: string;
  description: string;
}

export function getAllThemes(): Theme[] {
  const db = getDb();
  return db.prepare('SELECT * FROM themes ORDER BY name').all() as Theme[];
}

export function getThemeByName(name: string): Theme | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM themes WHERE name = ?').get(name) as Theme | undefined;
}

export function parseThemeContent(content: string): ThemeItem[] {
  return content.split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const colonIdx = line.indexOf(':');
      return {
        title: line.substring(0, colonIdx).trim(),
        description: line.substring(colonIdx + 1).trim()
      };
    });
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}

export function searchVerses(query: string, limit = 50, offset = 0, bible = 'osnb1'): SearchResponse {
  if (!query || query.length < 2) return { results: [], total: 0, hasMore: false };

  const db = getDb();

  const countResult = db.prepare(`
    SELECT COUNT(*) as total
    FROM verses v
    WHERE v.text LIKE ? AND v.bible = ?
  `).get(`%${query}%`, bible) as { total: number };

  const total = countResult.total;

  const results = db.prepare(`
    SELECT v.book_id, b.name_no as book_name_no, b.short_name as book_short_name,
           v.chapter, v.verse, v.text
    FROM verses v
    JOIN books b ON v.book_id = b.id
    WHERE v.text LIKE ? AND v.bible = ?
    ORDER BY v.book_id, v.chapter, v.verse
    LIMIT ? OFFSET ?
  `).all(`%${query}%`, bible, limit, offset) as SearchResult[];

  return { results, total, hasMore: offset + results.length < total };
}

export function getVerseCount(bookId: number, chapter: number, bible = 'osnb1'): number {
  const db = getDb();
  const result = db.prepare(
    'SELECT MAX(verse) as count FROM verses WHERE book_id = ? AND chapter = ? AND bible = ?'
  ).get(bookId, chapter, bible) as { count: number } | undefined;
  return result?.count ?? 0;
}

export interface OriginalWordSearchResult {
  book_id: number;
  book_name_no: string;
  book_short_name: string;
  chapter: number;
  verse: number;
  text: string;
  original_text: string;
  norwegianWords: string[]; // Norwegian words that translate to the matched original word
  originalWordsInVerse: string[]; // The actual original words found in this verse (from word4word)
}

export interface OriginalWordSearchResponse {
  results: OriginalWordSearchResult[];
  total: number;
  hasMore: boolean;
  word: string;
  language: 'hebrew' | 'greek';
  matchingWords: string[]; // All word variants that matched (for highlighting)
}

/**
 * Normalize Hebrew text by removing cantillation marks (ta'amim)
 * Keeps vowel points (nikkud) for better matching
 * Cantillation marks: U+0591-U+05AF
 */
function normalizeHebrew(text: string): string {
  // Remove cantillation marks (U+0591 to U+05AF)
  return text.replace(/[\u0591-\u05AF]/g, '');
}

/**
 * Strip all Hebrew diacritics (both cantillation and vowels) for consonant-only matching
 * Used for prefix detection where vowels differ
 */
function stripHebrewDiacritics(text: string): string {
  // Remove cantillation marks (U+0591-U+05AF) AND vowel points (U+05B0-U+05C7)
  return text.replace(/[\u0591-\u05C7]/g, '');
}

/**
 * Normalize Greek text by removing diacritical variations
 * This handles different accent marks on the same base character
 */
function normalizeGreek(text: string): string {
  // Normalize to NFD (decomposed form), remove combining diacriticals, then back to NFC
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

export function searchOriginalWord(word: string, limit = 50, offset = 0): OriginalWordSearchResponse {
  if (!word) return { results: [], total: 0, hasMore: false, word: '', language: 'greek', matchingWords: [] };

  const db = getDb();

  // Determine language based on word characters
  const isHebrew = /[\u0590-\u05FF]/.test(word);
  const bible = isHebrew ? 'tanach' : 'sblgnt';
  const language = isHebrew ? 'hebrew' : 'greek';

  // Normalize the search word
  const normalizedWord = isHebrew ? normalizeHebrew(word) : normalizeGreek(word);

  // Get all unique words from the bible and find those matching when normalized
  const allWords = db.prepare(`
    SELECT DISTINCT word FROM word4word WHERE bible = ?
  `).all(bible) as { word: string }[];

  // For Hebrew, also match words that CONTAIN the normalized word (to handle prefixes)
  // Hebrew prefixes like בְּ (be-), הַ (ha-), וְ (ve-) are attached to the word
  const strippedWord = isHebrew ? stripHebrewDiacritics(word) : normalizedWord;

  const matchingWords = allWords
    .filter(w => {
      const normalized = isHebrew ? normalizeHebrew(w.word) : normalizeGreek(w.word);
      if (normalized === normalizedWord) return true;
      // For Hebrew, check if consonants end with the search term (handles prefix + vowel differences)
      if (isHebrew) {
        const stripped = stripHebrewDiacritics(w.word);
        if (stripped.endsWith(strippedWord)) return true;
      }
      return false;
    })
    .map(w => w.word);

  if (matchingWords.length === 0) {
    return { results: [], total: 0, hasMore: false, word, language, matchingWords: [] };
  }

  // Create placeholders for IN clause
  const placeholders = matchingWords.map(() => '?').join(',');

  // Count total matches
  const countResult = db.prepare(`
    SELECT COUNT(DISTINCT w.book_id || '-' || w.chapter || '-' || w.verse) as total
    FROM word4word w
    WHERE w.word IN (${placeholders}) AND w.bible = ?
  `).get(...matchingWords, bible) as { total: number };

  const total = countResult.total;

  // Get matching verses with both Norwegian and original text
  const rawResults = db.prepare(`
    SELECT DISTINCT
      w.book_id,
      b.name_no as book_name_no,
      b.short_name as book_short_name,
      w.chapter,
      w.verse,
      v_no.text as text,
      v_orig.text as original_text
    FROM word4word w
    JOIN books b ON w.book_id = b.id
    JOIN verses v_no ON w.book_id = v_no.book_id AND w.chapter = v_no.chapter AND w.verse = v_no.verse AND v_no.bible = 'osnb1'
    JOIN verses v_orig ON w.book_id = v_orig.book_id AND w.chapter = v_orig.chapter AND w.verse = v_orig.verse AND v_orig.bible = ?
    WHERE w.word IN (${placeholders}) AND w.bible = ?
    ORDER BY w.book_id, w.chapter, w.verse
    LIMIT ? OFFSET ?
  `).all(bible, ...matchingWords, bible, limit, offset) as Omit<OriginalWordSearchResult, 'norwegianWords'>[];

  // For each result, find the Norwegian words and original words that match
  const results: OriginalWordSearchResult[] = rawResults.map(r => {
    // Get Norwegian word4word entries for this verse
    const norwegianEntries = db.prepare(`
      SELECT DISTINCT word, original FROM word4word
      WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = 'osnb1' AND original IS NOT NULL
    `).all(r.book_id, r.chapter, r.verse) as { word: string; original: string }[];

    // Get original language word4word entries for this verse
    const originalEntries = db.prepare(`
      SELECT DISTINCT word FROM word4word
      WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = ?
    `).all(r.book_id, r.chapter, r.verse, bible) as { word: string }[];

    // Find Norwegian words whose 'original' matches when normalized/stripped
    const norwegianWords = norwegianEntries
      .filter(entry => {
        if (!entry.original) return false;
        const normalizedOriginal = isHebrew ? normalizeHebrew(entry.original) : normalizeGreek(entry.original);
        const strippedOriginal = isHebrew ? stripHebrewDiacritics(entry.original) : normalizedOriginal;
        // Check exact match or prefix match (for Hebrew)
        if (normalizedOriginal === normalizedWord) return true;
        if (isHebrew && strippedOriginal.endsWith(strippedWord)) return true;
        return false;
      })
      .map(entry => entry.word);

    // Find original words in this verse that match
    const originalWordsInVerse = originalEntries
      .filter(entry => {
        const normalized = isHebrew ? normalizeHebrew(entry.word) : normalizeGreek(entry.word);
        const stripped = isHebrew ? stripHebrewDiacritics(entry.word) : normalized;
        if (normalized === normalizedWord) return true;
        if (isHebrew && stripped.endsWith(strippedWord)) return true;
        return false;
      })
      .map(entry => entry.word);

    return { ...r, norwegianWords, originalWordsInVerse };
  });

  return { results, total, hasMore: offset + results.length < total, word, language, matchingWords };
}
