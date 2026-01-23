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

export interface VerseRef {
  bookId: number;
  chapter: number;
  verse?: number;
  verses?: number[];
}

export interface VerseWithOriginal {
  verse: Verse;
  originalText: string | null;
  originalLanguage: 'hebrew' | 'greek';
  bookShortName: string;
}

export function getVerse(bookId: number, chapter: number, verseNum: number, bible = 'osnb1'): Verse | undefined {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM verses WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = ?'
  ).get(bookId, chapter, verseNum, bible) as Verse | undefined;
}

export function getOriginalVerse(bookId: number, chapter: number, verseNum: number): Verse | undefined {
  const db = getDb();
  const bible = bookId <= 39 ? 'tanach' : 'sblgnt';
  return db.prepare(
    'SELECT * FROM verses WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = ?'
  ).get(bookId, chapter, verseNum, bible) as Verse | undefined;
}

export function getVersesWithOriginal(refs: VerseRef[], bible = 'osnb1'): VerseWithOriginal[] {
  const results: VerseWithOriginal[] = [];

  for (const ref of refs) {
    const book = getBookById(ref.bookId);
    if (!book) continue;

    const verseNums = ref.verses || (ref.verse ? [ref.verse] : []);

    for (const verseNum of verseNums) {
      const verse = getVerse(ref.bookId, ref.chapter, verseNum, bible);
      if (!verse) continue;

      const originalVerse = getOriginalVerse(ref.bookId, ref.chapter, verseNum);

      results.push({
        verse,
        originalText: originalVerse?.text || null,
        originalLanguage: getOriginalLanguage(ref.bookId),
        bookShortName: book.short_name
      });
    }
  }

  return results;
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

export function getChapterContext(bookId: number, chapter: number): string | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT context FROM chapter_context WHERE book_id = ? AND chapter = ?'
  ).get(bookId, chapter) as { context: string } | undefined;
  return result?.context ?? null;
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

// Gammelt format (txt-filer)
export interface ThemeItem {
  title: string;
  description: string;
}

// Nytt JSON-format
export interface ThemeVerseRef {
  bookId: number;
  chapter: number;
  verse?: number;
  verses?: number[];
}

export interface ThemeSection {
  title: string;
  description?: string;
  verses: ThemeVerseRef[];
}

export interface ThemeData {
  title: string;
  introduction?: string;
  sections: ThemeSection[];
}

export function getAllThemes(): Theme[] {
  const db = getDb();
  return db.prepare('SELECT * FROM themes ORDER BY name').all() as Theme[];
}

export function getThemeByName(name: string): Theme | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM themes WHERE name = ?').get(name) as Theme | undefined;
}

export function isJsonTheme(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && 'sections' in parsed;
  } catch {
    return false;
  }
}

export function parseThemeJson(content: string): ThemeData | null {
  try {
    return JSON.parse(content) as ThemeData;
  } catch {
    return null;
  }
}

// Beholdes for bakoverkompatibilitet med txt-filer
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

// Timeline types and functions

export interface TimelinePeriod {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  sort_order: number;
}

export interface TimelineReference {
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  book_short_name?: string;
  book_name_no?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  year_display: string | null;
  period_id: string | null;
  importance: string;
  sort_order: number;
  references?: TimelineReference[];
  period?: TimelinePeriod;
}

export interface TimelineData {
  periods: TimelinePeriod[];
  events: TimelineEvent[];
}

export function getTimelinePeriods(): TimelinePeriod[] {
  const db = getDb();
  return db.prepare('SELECT * FROM timeline_periods ORDER BY sort_order').all() as TimelinePeriod[];
}

export function getTimelineEvents(): TimelineEvent[] {
  const db = getDb();
  const events = db.prepare(`
    SELECT e.*, p.name as period_name, p.color as period_color
    FROM timeline_events e
    LEFT JOIN timeline_periods p ON e.period_id = p.id
    ORDER BY e.sort_order
  `).all() as (TimelineEvent & { period_name?: string; period_color?: string })[];

  // Get references for each event
  return events.map(event => {
    const refs = db.prepare(`
      SELECT tr.book_id, tr.chapter, tr.verse_start, tr.verse_end, b.short_name as book_short_name, b.name_no as book_name_no
      FROM timeline_references tr
      JOIN books b ON tr.book_id = b.id
      WHERE tr.event_id = ?
    `).all(event.id) as TimelineReference[];

    return {
      ...event,
      references: refs,
      period: event.period_id ? {
        id: event.period_id,
        name: event.period_name || '',
        color: event.period_color || null,
        description: null,
        sort_order: 0
      } : undefined
    };
  });
}

export function getTimelineEventById(id: string): TimelineEvent | undefined {
  const db = getDb();
  const event = db.prepare(`
    SELECT e.*, p.name as period_name, p.color as period_color, p.description as period_description
    FROM timeline_events e
    LEFT JOIN timeline_periods p ON e.period_id = p.id
    WHERE e.id = ?
  `).get(id) as (TimelineEvent & { period_name?: string; period_color?: string; period_description?: string }) | undefined;

  if (!event) return undefined;

  const refs = db.prepare(`
    SELECT tr.book_id, tr.chapter, tr.verse_start, tr.verse_end, b.short_name as book_short_name, b.name_no as book_name_no
    FROM timeline_references tr
    JOIN books b ON tr.book_id = b.id
    WHERE tr.event_id = ?
  `).all(id) as TimelineReference[];

  return {
    ...event,
    references: refs,
    period: event.period_id ? {
      id: event.period_id,
      name: event.period_name || '',
      color: event.period_color || null,
      description: event.period_description || null,
      sort_order: 0
    } : undefined
  };
}

export function getTimelineEventsByPeriod(periodId: string): TimelineEvent[] {
  const db = getDb();
  const events = db.prepare(`
    SELECT e.*, p.name as period_name, p.color as period_color
    FROM timeline_events e
    LEFT JOIN timeline_periods p ON e.period_id = p.id
    WHERE e.period_id = ?
    ORDER BY e.sort_order
  `).all(periodId) as (TimelineEvent & { period_name?: string; period_color?: string })[];

  return events.map(event => {
    const refs = db.prepare(`
      SELECT tr.book_id, tr.chapter, tr.verse_start, tr.verse_end, b.short_name as book_short_name, b.name_no as book_name_no
      FROM timeline_references tr
      JOIN books b ON tr.book_id = b.id
      WHERE tr.event_id = ?
    `).all(event.id) as TimelineReference[];

    return {
      ...event,
      references: refs,
      period: event.period_id ? {
        id: event.period_id,
        name: event.period_name || '',
        color: event.period_color || null,
        description: null,
        sort_order: 0
      } : undefined
    };
  });
}

export function getFullTimeline(): TimelineData {
  return {
    periods: getTimelinePeriods(),
    events: getTimelineEvents()
  };
}

export function getTimelineEventsForChapter(bookId: number, chapter: number): TimelineEvent[] {
  const db = getDb();

  // Find events that have references to this book and chapter
  const eventIds = db.prepare(`
    SELECT DISTINCT event_id
    FROM timeline_references
    WHERE book_id = ? AND chapter = ?
  `).all(bookId, chapter) as { event_id: string }[];

  if (eventIds.length === 0) return [];

  const events: TimelineEvent[] = [];
  for (const { event_id } of eventIds) {
    const event = getTimelineEventById(event_id);
    if (event) {
      events.push(event);
    }
  }

  // Sort by sort_order
  return events.sort((a, b) => a.sort_order - b.sort_order);
}

// Prophecy types and functions

export interface ProphecyCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface ProphecyReference {
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  book_short_name?: string;
  book_name_no?: string;
  reference?: string;
}

export interface Prophecy {
  id: string;
  category_id: string;
  title: string;
  explanation: string | null;
  prophecy: ProphecyReference;
  fulfillments: ProphecyReference[];
  category?: ProphecyCategory;
}

export interface ProphecyData {
  categories: ProphecyCategory[];
  prophecies: Prophecy[];
}

export function getProphecyCategories(): ProphecyCategory[] {
  const db = getDb();
  return db.prepare('SELECT * FROM prophecy_categories').all() as ProphecyCategory[];
}

export function getProphecies(): Prophecy[] {
  const db = getDb();
  const prophecies = db.prepare(`
    SELECT p.*, c.name as category_name, c.description as category_description,
           b.short_name as prophecy_book_short_name, b.name_no as prophecy_book_name_no
    FROM prophecies p
    LEFT JOIN prophecy_categories c ON p.category_id = c.id
    LEFT JOIN books b ON p.prophecy_book_id = b.id
  `).all() as (Prophecy & {
    category_name?: string;
    category_description?: string;
    prophecy_book_id: number;
    prophecy_chapter: number;
    prophecy_verse_start: number;
    prophecy_verse_end: number;
    prophecy_book_short_name?: string;
    prophecy_book_name_no?: string;
  })[];

  return prophecies.map(p => {
    // Get fulfillments
    const fulfillments = db.prepare(`
      SELECT pf.book_id, pf.chapter, pf.verse_start, pf.verse_end,
             b.short_name as book_short_name, b.name_no as book_name_no
      FROM prophecy_fulfillments pf
      JOIN books b ON pf.book_id = b.id
      WHERE pf.prophecy_id = ?
    `).all(p.id) as ProphecyReference[];

    // Format reference strings
    const formatRef = (ref: ProphecyReference): string => {
      const verseRange = ref.verse_start === ref.verse_end
        ? `${ref.verse_start}`
        : `${ref.verse_start}-${ref.verse_end}`;
      return `${ref.book_short_name} ${ref.chapter}:${verseRange}`;
    };

    const prophecyRef: ProphecyReference = {
      book_id: p.prophecy_book_id,
      chapter: p.prophecy_chapter,
      verse_start: p.prophecy_verse_start,
      verse_end: p.prophecy_verse_end,
      book_short_name: p.prophecy_book_short_name,
      book_name_no: p.prophecy_book_name_no
    };
    prophecyRef.reference = formatRef(prophecyRef);

    const fulfillmentsWithRef = fulfillments.map(f => ({
      ...f,
      reference: formatRef(f)
    }));

    return {
      id: p.id,
      category_id: p.category_id,
      title: p.title,
      explanation: p.explanation,
      prophecy: prophecyRef,
      fulfillments: fulfillmentsWithRef,
      category: p.category_id ? {
        id: p.category_id,
        name: p.category_name || '',
        description: p.category_description || null
      } : undefined
    };
  });
}

export function getProphecyById(id: string): Prophecy | undefined {
  const db = getDb();
  const prophecy = db.prepare(`
    SELECT p.*, c.name as category_name, c.description as category_description,
           b.short_name as prophecy_book_short_name, b.name_no as prophecy_book_name_no
    FROM prophecies p
    LEFT JOIN prophecy_categories c ON p.category_id = c.id
    LEFT JOIN books b ON p.prophecy_book_id = b.id
    WHERE p.id = ?
  `).get(id) as (Prophecy & {
    category_name?: string;
    category_description?: string;
    prophecy_book_id: number;
    prophecy_chapter: number;
    prophecy_verse_start: number;
    prophecy_verse_end: number;
    prophecy_book_short_name?: string;
    prophecy_book_name_no?: string;
  }) | undefined;

  if (!prophecy) return undefined;

  const fulfillments = db.prepare(`
    SELECT pf.book_id, pf.chapter, pf.verse_start, pf.verse_end,
           b.short_name as book_short_name, b.name_no as book_name_no
    FROM prophecy_fulfillments pf
    JOIN books b ON pf.book_id = b.id
    WHERE pf.prophecy_id = ?
  `).all(id) as ProphecyReference[];

  const formatRef = (ref: ProphecyReference): string => {
    const verseRange = ref.verse_start === ref.verse_end
      ? `${ref.verse_start}`
      : `${ref.verse_start}-${ref.verse_end}`;
    return `${ref.book_short_name} ${ref.chapter}:${verseRange}`;
  };

  const prophecyRef: ProphecyReference = {
    book_id: prophecy.prophecy_book_id,
    chapter: prophecy.prophecy_chapter,
    verse_start: prophecy.prophecy_verse_start,
    verse_end: prophecy.prophecy_verse_end,
    book_short_name: prophecy.prophecy_book_short_name,
    book_name_no: prophecy.prophecy_book_name_no
  };
  prophecyRef.reference = formatRef(prophecyRef);

  return {
    id: prophecy.id,
    category_id: prophecy.category_id,
    title: prophecy.title,
    explanation: prophecy.explanation,
    prophecy: prophecyRef,
    fulfillments: fulfillments.map(f => ({ ...f, reference: formatRef(f) })),
    category: prophecy.category_id ? {
      id: prophecy.category_id,
      name: prophecy.category_name || '',
      description: prophecy.category_description || null
    } : undefined
  };
}

export function getPropheciesByCategory(categoryId: string): Prophecy[] {
  const all = getProphecies();
  return all.filter(p => p.category_id === categoryId);
}

export function getFullProphecyData(): ProphecyData {
  return {
    categories: getProphecyCategories(),
    prophecies: getProphecies()
  };
}

export function getPropheciesForChapter(bookId: number, chapter: number): Prophecy[] {
  const db = getDb();

  // Find prophecies that reference this chapter (either as prophecy or fulfillment)
  const prophecyIds = db.prepare(`
    SELECT DISTINCT p.id
    FROM prophecies p
    WHERE (p.prophecy_book_id = ? AND p.prophecy_chapter = ?)
    UNION
    SELECT DISTINCT pf.prophecy_id
    FROM prophecy_fulfillments pf
    WHERE pf.book_id = ? AND pf.chapter = ?
  `).all(bookId, chapter, bookId, chapter) as { id: string }[];

  if (prophecyIds.length === 0) return [];

  const prophecies: Prophecy[] = [];
  for (const { id } of prophecyIds) {
    const prophecy = getProphecyById(id);
    if (prophecy) {
      prophecies.push(prophecy);
    }
  }

  return prophecies;
}

export function getPropheciesForVerse(bookId: number, chapter: number, verse: number): Prophecy[] {
  const db = getDb();

  // Find prophecies where this verse is part of the prophecy reference or a fulfillment
  const prophecyIds = db.prepare(`
    SELECT DISTINCT p.id
    FROM prophecies p
    WHERE p.prophecy_book_id = ? AND p.prophecy_chapter = ?
      AND ? >= p.prophecy_verse_start AND ? <= p.prophecy_verse_end
    UNION
    SELECT DISTINCT pf.prophecy_id
    FROM prophecy_fulfillments pf
    WHERE pf.book_id = ? AND pf.chapter = ?
      AND ? >= pf.verse_start AND ? <= pf.verse_end
  `).all(bookId, chapter, verse, verse, bookId, chapter, verse, verse) as { id: string }[];

  if (prophecyIds.length === 0) return [];

  const prophecies: Prophecy[] = [];
  for (const { id } of prophecyIds) {
    const prophecy = getProphecyById(id);
    if (prophecy) {
      prophecies.push(prophecy);
    }
  }

  return prophecies;
}

// Person types and functions

export interface PersonVerseRef {
  bookId: number;
  chapter: number;
  verse?: number;
  verses?: number[];
}

export interface PersonKeyEvent {
  title: string;
  description: string;
  verses: PersonVerseRef[];
}

export interface PersonFamily {
  father?: string | null;
  mother?: string | null;
  siblings?: string[];
  spouse?: string | null;
  children?: string[];
}

export interface PersonData {
  id: string;
  name: string;
  title: string;
  era: string;
  lifespan?: string;
  summary: string;
  roles: string[];
  family?: PersonFamily;
  relatedPersons?: string[];
  keyEvents: PersonKeyEvent[];
}

export interface Person {
  id: number;
  name: string;
  content: string;
}

// Era labels in Norwegian
export const eraLabels: Record<string, string> = {
  'creation': 'Skapelsen',
  'patriarchs': 'Patriarkene',
  'exodus': 'Utgang fra Egypt',
  'conquest': 'Erobringen',
  'judges': 'Dommertiden',
  'united-kingdom': 'Det forente kongerike',
  'divided-kingdom': 'Det delte kongerike',
  'exile': 'Eksilet',
  'return': 'Tilbakekomsten',
  'intertestamental': 'Mellomtestamentlig tid',
  'jesus': 'Jesu tid',
  'early-church': 'Den tidlige kirke'
};

// Role labels in Norwegian
export const roleLabels: Record<string, string> = {
  'profet': 'Profet',
  'konge': 'Konge',
  'dommer': 'Dommer',
  'prest': 'Prest',
  'apostel': 'Apostel',
  'disippel': 'Disippel',
  'leder': 'Leder',
  'matriark': 'Matriark',
  'patriark': 'Patriark',
  'martyr': 'Martyr',
  'kriger': 'Kriger',
  'vismann': 'Vismann'
};

export function getAllPersons(): Person[] {
  const db = getDb();
  return db.prepare('SELECT * FROM persons ORDER BY name').all() as Person[];
}

export function getPersonByName(name: string): Person | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM persons WHERE name = ?').get(name) as Person | undefined;
}

export function parsePersonContent(content: string): PersonData | null {
  try {
    return JSON.parse(content) as PersonData;
  } catch {
    return null;
  }
}

export function getPersonData(name: string): PersonData | null {
  const person = getPersonByName(name);
  if (!person) return null;
  return parsePersonContent(person.content);
}

export function getAllPersonsData(): PersonData[] {
  const persons = getAllPersons();
  return persons
    .map(p => parsePersonContent(p.content))
    .filter((p): p is PersonData => p !== null);
}

export function getPersonsByRole(role: string): PersonData[] {
  const allPersons = getAllPersonsData();
  return allPersons.filter(p => p.roles.includes(role));
}

export function getPersonsByEra(era: string): PersonData[] {
  const allPersons = getAllPersonsData();
  return allPersons.filter(p => p.era === era);
}

export function getRelatedPersonsData(personId: string): PersonData[] {
  const person = getPersonData(personId);
  if (!person || !person.relatedPersons) return [];

  return person.relatedPersons
    .map(id => getPersonData(id))
    .filter((p): p is PersonData => p !== null);
}

// Chapter Insights types and functions

export interface ChapterInsightBase {
  type: string;
  title: string;
  buttonText: string;
  hint: string;
  intro: string;
}

export interface ChapterInsightDbRow {
  book_id: number;
  chapter: number;
  type: string;
  content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getChapterInsight(bookId: number, chapter: number): any | null {
  const db = getDb();
  const result = db.prepare(
    'SELECT content FROM chapter_insights WHERE book_id = ? AND chapter = ?'
  ).get(bookId, chapter) as { content: string } | undefined;

  if (!result) return null;

  try {
    return JSON.parse(result.content);
  } catch {
    return null;
  }
}
