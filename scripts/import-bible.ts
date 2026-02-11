import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import {
  computeHash,
  hasContentChanged,
  updateContentHash,
  createContentHashesTable,
  incrementSyncVersion,
  getSyncVersion,
} from './import-utils';

const GENERATE_PATH = path.join(process.cwd(), '..', 'free-bible', 'generate');
const DB_PATH = path.join(process.cwd(), 'data', 'bible.db');

// Parse command line arguments
const args = process.argv.slice(2);
const isFullImport = args.includes('--full');

// Statistics tracking
interface ImportStats {
  chapters: { updated: number; unchanged: number };
  word4word: { updated: number; unchanged: number };
  references: { updated: number; unchanged: number };
  bookSummaries: { updated: number; unchanged: number };
  bookContext: { updated: number; unchanged: number };
  chapterSummaries: { updated: number; unchanged: number };
  chapterContext: { updated: number; unchanged: number };
  importantWords: { updated: number; unchanged: number };
  versePrayers: { updated: number; unchanged: number };
  verseSermons: { updated: number; unchanged: number };
  themes: { updated: number; unchanged: number };
  timeline: { updated: number; unchanged: number };
  prophecies: { updated: number; unchanged: number };
  persons: { updated: number; unchanged: number };
  chapterInsights: { updated: number; unchanged: number };
  dailyVerses: { updated: number; unchanged: number };
  readingPlans: { updated: number; unchanged: number };
  gospelParallels: { updated: number; unchanged: number };
  verseMappings: { updated: number; unchanged: number };
}

const stats: ImportStats = {
  chapters: { updated: 0, unchanged: 0 },
  word4word: { updated: 0, unchanged: 0 },
  references: { updated: 0, unchanged: 0 },
  bookSummaries: { updated: 0, unchanged: 0 },
  bookContext: { updated: 0, unchanged: 0 },
  chapterSummaries: { updated: 0, unchanged: 0 },
  chapterContext: { updated: 0, unchanged: 0 },
  importantWords: { updated: 0, unchanged: 0 },
  versePrayers: { updated: 0, unchanged: 0 },
  verseSermons: { updated: 0, unchanged: 0 },
  themes: { updated: 0, unchanged: 0 },
  timeline: { updated: 0, unchanged: 0 },
  prophecies: { updated: 0, unchanged: 0 },
  persons: { updated: 0, unchanged: 0 },
  chapterInsights: { updated: 0, unchanged: 0 },
  dailyVerses: { updated: 0, unchanged: 0 },
  readingPlans: { updated: 0, unchanged: 0 },
  gospelParallels: { updated: 0, unchanged: 0 },
  verseMappings: { updated: 0, unchanged: 0 },
};

// Sørg for at data-mappen eksisterer
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// For full import: delete existing database
if (isFullImport) {
  console.log('Full import modus - sletter eksisterende database...');
  const dbFiles = [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`];
  for (const file of dbFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Slettet: ${path.basename(file)}`);
    }
  }
} else {
  console.log('Inkrementell import modus - oppdaterer kun endret innhold...');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

// Bokliste
const books = [
  { id: 1, name: 'Genesis', name_no: '1. Mosebok', short_name: '1Mos', testament: 'OT', chapters: 50 },
  { id: 2, name: 'Exodus', name_no: '2. Mosebok', short_name: '2Mos', testament: 'OT', chapters: 40 },
  { id: 3, name: 'Leviticus', name_no: '3. Mosebok', short_name: '3Mos', testament: 'OT', chapters: 27 },
  { id: 4, name: 'Numbers', name_no: '4. Mosebok', short_name: '4Mos', testament: 'OT', chapters: 36 },
  { id: 5, name: 'Deuteronomy', name_no: '5. Mosebok', short_name: '5Mos', testament: 'OT', chapters: 34 },
  { id: 6, name: 'Joshua', name_no: 'Josva', short_name: 'Jos', testament: 'OT', chapters: 24 },
  { id: 7, name: 'Judges', name_no: 'Dommerne', short_name: 'Dom', testament: 'OT', chapters: 21 },
  { id: 8, name: 'Ruth', name_no: 'Rut', short_name: 'Rut', testament: 'OT', chapters: 4 },
  { id: 9, name: '1 Samuel', name_no: '1. Samuel', short_name: '1Sam', testament: 'OT', chapters: 31 },
  { id: 10, name: '2 Samuel', name_no: '2. Samuel', short_name: '2Sam', testament: 'OT', chapters: 24 },
  { id: 11, name: '1 Kings', name_no: '1. Kongebok', short_name: '1Kong', testament: 'OT', chapters: 22 },
  { id: 12, name: '2 Kings', name_no: '2. Kongebok', short_name: '2Kong', testament: 'OT', chapters: 25 },
  { id: 13, name: '1 Chronicles', name_no: '1. Krønikebok', short_name: '1Krøn', testament: 'OT', chapters: 29 },
  { id: 14, name: '2 Chronicles', name_no: '2. Krønikebok', short_name: '2Krøn', testament: 'OT', chapters: 36 },
  { id: 15, name: 'Ezra', name_no: 'Esra', short_name: 'Esr', testament: 'OT', chapters: 10 },
  { id: 16, name: 'Nehemiah', name_no: 'Nehemja', short_name: 'Neh', testament: 'OT', chapters: 13 },
  { id: 17, name: 'Esther', name_no: 'Ester', short_name: 'Est', testament: 'OT', chapters: 10 },
  { id: 18, name: 'Job', name_no: 'Job', short_name: 'Job', testament: 'OT', chapters: 42 },
  { id: 19, name: 'Psalms', name_no: 'Salmene', short_name: 'Sal', testament: 'OT', chapters: 150 },
  { id: 20, name: 'Proverbs', name_no: 'Ordspråkene', short_name: 'Ord', testament: 'OT', chapters: 31 },
  { id: 21, name: 'Ecclesiastes', name_no: 'Forkynneren', short_name: 'Fork', testament: 'OT', chapters: 12 },
  { id: 22, name: 'Song of Solomon', name_no: 'Høysangen', short_name: 'Høy', testament: 'OT', chapters: 8 },
  { id: 23, name: 'Isaiah', name_no: 'Jesaja', short_name: 'Jes', testament: 'OT', chapters: 66 },
  { id: 24, name: 'Jeremiah', name_no: 'Jeremia', short_name: 'Jer', testament: 'OT', chapters: 52 },
  { id: 25, name: 'Lamentations', name_no: 'Klagesangene', short_name: 'Klag', testament: 'OT', chapters: 5 },
  { id: 26, name: 'Ezekiel', name_no: 'Esekiel', short_name: 'Esek', testament: 'OT', chapters: 48 },
  { id: 27, name: 'Daniel', name_no: 'Daniel', short_name: 'Dan', testament: 'OT', chapters: 12 },
  { id: 28, name: 'Hosea', name_no: 'Hosea', short_name: 'Hos', testament: 'OT', chapters: 14 },
  { id: 29, name: 'Joel', name_no: 'Joel', short_name: 'Joel', testament: 'OT', chapters: 3 },
  { id: 30, name: 'Amos', name_no: 'Amos', short_name: 'Amos', testament: 'OT', chapters: 9 },
  { id: 31, name: 'Obadiah', name_no: 'Obadja', short_name: 'Ob', testament: 'OT', chapters: 1 },
  { id: 32, name: 'Jonah', name_no: 'Jona', short_name: 'Jona', testament: 'OT', chapters: 4 },
  { id: 33, name: 'Micah', name_no: 'Mika', short_name: 'Mika', testament: 'OT', chapters: 7 },
  { id: 34, name: 'Nahum', name_no: 'Nahum', short_name: 'Nah', testament: 'OT', chapters: 3 },
  { id: 35, name: 'Habakkuk', name_no: 'Habakkuk', short_name: 'Hab', testament: 'OT', chapters: 3 },
  { id: 36, name: 'Zephaniah', name_no: 'Sefanja', short_name: 'Sef', testament: 'OT', chapters: 3 },
  { id: 37, name: 'Haggai', name_no: 'Haggai', short_name: 'Hag', testament: 'OT', chapters: 2 },
  { id: 38, name: 'Zechariah', name_no: 'Sakarja', short_name: 'Sak', testament: 'OT', chapters: 14 },
  { id: 39, name: 'Malachi', name_no: 'Malaki', short_name: 'Mal', testament: 'OT', chapters: 3 },
  { id: 40, name: 'Matthew', name_no: 'Matteus', short_name: 'Matt', testament: 'NT', chapters: 28 },
  { id: 41, name: 'Mark', name_no: 'Markus', short_name: 'Mark', testament: 'NT', chapters: 16 },
  { id: 42, name: 'Luke', name_no: 'Lukas', short_name: 'Luk', testament: 'NT', chapters: 24 },
  { id: 43, name: 'John', name_no: 'Johannes', short_name: 'Joh', testament: 'NT', chapters: 21 },
  { id: 44, name: 'Acts', name_no: 'Apostlenes gjerninger', short_name: 'Apg', testament: 'NT', chapters: 28 },
  { id: 45, name: 'Romans', name_no: 'Romerne', short_name: 'Rom', testament: 'NT', chapters: 16 },
  { id: 46, name: '1 Corinthians', name_no: '1. Korinter', short_name: '1Kor', testament: 'NT', chapters: 16 },
  { id: 47, name: '2 Corinthians', name_no: '2. Korinter', short_name: '2Kor', testament: 'NT', chapters: 13 },
  { id: 48, name: 'Galatians', name_no: 'Galaterne', short_name: 'Gal', testament: 'NT', chapters: 6 },
  { id: 49, name: 'Ephesians', name_no: 'Efeserne', short_name: 'Ef', testament: 'NT', chapters: 6 },
  { id: 50, name: 'Philippians', name_no: 'Filipperne', short_name: 'Fil', testament: 'NT', chapters: 4 },
  { id: 51, name: 'Colossians', name_no: 'Kolosserne', short_name: 'Kol', testament: 'NT', chapters: 4 },
  { id: 52, name: '1 Thessalonians', name_no: '1. Tessaloniker', short_name: '1Tess', testament: 'NT', chapters: 5 },
  { id: 53, name: '2 Thessalonians', name_no: '2. Tessaloniker', short_name: '2Tess', testament: 'NT', chapters: 3 },
  { id: 54, name: '1 Timothy', name_no: '1. Timoteus', short_name: '1Tim', testament: 'NT', chapters: 6 },
  { id: 55, name: '2 Timothy', name_no: '2. Timoteus', short_name: '2Tim', testament: 'NT', chapters: 4 },
  { id: 56, name: 'Titus', name_no: 'Titus', short_name: 'Tit', testament: 'NT', chapters: 3 },
  { id: 57, name: 'Philemon', name_no: 'Filemon', short_name: 'Filem', testament: 'NT', chapters: 1 },
  { id: 58, name: 'Hebrews', name_no: 'Hebreerne', short_name: 'Hebr', testament: 'NT', chapters: 13 },
  { id: 59, name: 'James', name_no: 'Jakob', short_name: 'Jak', testament: 'NT', chapters: 5 },
  { id: 60, name: '1 Peter', name_no: '1. Peter', short_name: '1Pet', testament: 'NT', chapters: 5 },
  { id: 61, name: '2 Peter', name_no: '2. Peter', short_name: '2Pet', testament: 'NT', chapters: 3 },
  { id: 62, name: '1 John', name_no: '1. Johannes', short_name: '1Joh', testament: 'NT', chapters: 5 },
  { id: 63, name: '2 John', name_no: '2. Johannes', short_name: '2Joh', testament: 'NT', chapters: 1 },
  { id: 64, name: '3 John', name_no: '3. Johannes', short_name: '3Joh', testament: 'NT', chapters: 1 },
  { id: 65, name: 'Jude', name_no: 'Judas', short_name: 'Jud', testament: 'NT', chapters: 1 },
  { id: 66, name: 'Revelation', name_no: 'Åpenbaringen', short_name: 'Åp', testament: 'NT', chapters: 22 },
];

console.log('Oppretter database-skjema...');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    name_no TEXT NOT NULL,
    short_name TEXT NOT NULL,
    testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapters INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    bible TEXT NOT NULL DEFAULT 'osnb2',
    versions TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter, verse, bible)
  );

  CREATE TABLE IF NOT EXISTS word4word (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    word_index INTEGER NOT NULL,
    word TEXT NOT NULL,
    original TEXT,
    pronunciation TEXT,
    explanation TEXT,
    bible TEXT NOT NULL DEFAULT 'osnb2',
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter, verse, word_index, bible)
  );

  CREATE TABLE IF NOT EXISTS references_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_book_id INTEGER NOT NULL,
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book_id INTEGER NOT NULL,
    to_chapter INTEGER NOT NULL,
    to_verse_start INTEGER NOT NULL,
    to_verse_end INTEGER NOT NULL,
    description TEXT,
    language TEXT NOT NULL DEFAULT 'nb',
    FOREIGN KEY (from_book_id) REFERENCES books(id),
    FOREIGN KEY (to_book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS book_summaries (
    book_id INTEGER PRIMARY KEY,
    summary TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS book_context (
    book_id INTEGER PRIMARY KEY,
    context TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS chapter_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    summary TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter)
  );

  CREATE TABLE IF NOT EXISTS chapter_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    context TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter)
  );

  CREATE TABLE IF NOT EXISTS important_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    word TEXT NOT NULL,
    explanation TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS important_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter, verse)
  );

  CREATE TABLE IF NOT EXISTS verse_prayers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    prayer TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter, verse)
  );

  CREATE TABLE IF NOT EXISTS verse_sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    sermon TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter, verse)
  );

  CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline_periods (
    id TEXT NOT NULL,
    timeline_type TEXT NOT NULL DEFAULT 'bible',
    name TEXT NOT NULL,
    color TEXT,
    description TEXT,
    sort_order INTEGER,
    PRIMARY KEY (id, timeline_type)
  );

  CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    year INTEGER,
    year_display TEXT,
    period_id TEXT,
    importance TEXT DEFAULT 'minor',
    sort_order INTEGER NOT NULL,
    timeline_type TEXT NOT NULL DEFAULT 'bible',
    region TEXT,
    book_id INTEGER,
    section_id TEXT
  );

  CREATE TABLE IF NOT EXISTS timeline_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES timeline_events(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS timeline_book_sections (
    id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    chapter_start INTEGER NOT NULL,
    chapter_end INTEGER NOT NULL,
    description TEXT,
    sort_order INTEGER,
    PRIMARY KEY (id, book_id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS prophecy_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS prophecies (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT,
    prophecy_book_id INTEGER NOT NULL,
    prophecy_chapter INTEGER NOT NULL,
    prophecy_verse_start INTEGER NOT NULL,
    prophecy_verse_end INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES prophecy_categories(id),
    FOREIGN KEY (prophecy_book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS prophecy_fulfillments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prophecy_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    FOREIGN KEY (prophecy_id) REFERENCES prophecies(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chapter_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id),
    UNIQUE (book_id, chapter)
  );

  CREATE TABLE IF NOT EXISTS daily_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    note TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS reading_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    days INTEGER NOT NULL,
    content TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS db_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gospel_parallel_sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gospel_parallels (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (section_id) REFERENCES gospel_parallel_sections(id)
  );

  CREATE TABLE IF NOT EXISTS gospel_parallel_passages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parallel_id TEXT NOT NULL,
    gospel TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    reference TEXT NOT NULL,
    FOREIGN KEY (parallel_id) REFERENCES gospel_parallels(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS verse_mappings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    book_names TEXT NOT NULL,
    verse_map TEXT NOT NULL,
    unmapped TEXT
  );

`);

// Create content_hashes table for incremental sync
createContentHashesTable(db);

// Importer bøker
console.log('Importerer bøker...');
const insertBook = db.prepare(`
  INSERT OR REPLACE INTO books (id, name, name_no, short_name, testament, chapters)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const book of books) {
  insertBook.run(book.id, book.name, book.name_no, book.short_name, book.testament, book.chapters);
}

// Importer vers med hash-sjekk
console.log('Importerer vers...');
const insertVerse = db.prepare(`
  INSERT OR REPLACE INTO verses (book_id, chapter, verse, text, bible, versions)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const deleteChapterVerses = db.prepare(`
  DELETE FROM verses WHERE book_id = ? AND chapter = ? AND bible = ?
`);

function importVerses(bible: string) {
  const biblePath = path.join(GENERATE_PATH, 'bibles_raw', bible);
  if (!fs.existsSync(biblePath)) {
    console.log(`  Hopper over ${bible} (ikke funnet)`);
    return;
  }

  const bookDirs = fs.readdirSync(biblePath).filter(f => !f.startsWith('.'));

  for (const bookDir of bookDirs) {
    const bookId = parseInt(bookDir);
    if (isNaN(bookId)) continue;

    const bookPath = path.join(biblePath, bookDir);
    const chapterFiles = fs.readdirSync(bookPath).filter(f => f.endsWith('.json'));

    for (const chapterFile of chapterFiles) {
      const chapterPath = path.join(bookPath, chapterFile);
      const chapterId = parseInt(chapterFile.replace('.json', ''));
      const content = fs.readFileSync(chapterPath, 'utf-8');
      const contentHash = computeHash(content);
      const contentKey = `${bible}-${bookId}-${chapterId}`;

      // Check if content has changed
      if (!isFullImport && !hasContentChanged(db, 'chapter', contentKey, contentHash)) {
        stats.chapters.unchanged++;
        continue;
      }

      // Content changed - update
      const verses = JSON.parse(content);
      deleteChapterVerses.run(bookId, chapterId, bible);
      for (const v of verses) {
        const versions = v.versions ? JSON.stringify(v.versions) : null;
        insertVerse.run(v.bookId, v.chapterId, v.verseId, v.text, bible, versions);
      }
      updateContentHash(db, 'chapter', contentKey, contentHash);
      stats.chapters.updated++;
    }
  }
}

console.log('  Importerer osnb2...');
importVerses('osnb2');
console.log('  Importerer osnn1...');
importVerses('osnn1');
console.log('  Importerer sblgnt...');
importVerses('sblgnt');
console.log('  Importerer tanach...');
importVerses('tanach');

// Importer word4word
console.log('Importerer word4word...');
const insertWord4Word = db.prepare(`
  INSERT OR REPLACE INTO word4word (book_id, chapter, verse, word_index, word, original, pronunciation, explanation, bible)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const deleteVerseWord4Word = db.prepare(`
  DELETE FROM word4word WHERE book_id = ? AND chapter = ? AND verse = ? AND bible = ?
`);

function importWord4Word(original: string, lang: string) {
  const word4wordPath = path.join(GENERATE_PATH, 'word4word', original, lang);
  if (!fs.existsSync(word4wordPath)) {
    console.log(`  Hopper over word4word for ${original}/${lang} (ikke funnet)`);
    return;
  }

  const bibleValue = `${original}-${lang}`;
  const bookDirs = fs.readdirSync(word4wordPath).filter(f => !f.startsWith('.'));

  for (const bookDir of bookDirs) {
    const bookId = parseInt(bookDir);
    if (isNaN(bookId)) continue;

    const bookPath = path.join(word4wordPath, bookDir);
    const chapterDirs = fs.readdirSync(bookPath).filter(f => !f.startsWith('.'));

    for (const chapterDir of chapterDirs) {
      const chapterId = parseInt(chapterDir);
      if (isNaN(chapterId)) continue;

      const chapterPath = path.join(bookPath, chapterDir);
      const verseFiles = fs.readdirSync(chapterPath).filter(f => f.endsWith('.json'));

      for (const verseFile of verseFiles) {
        const verseId = parseInt(verseFile.replace('.json', ''));
        if (isNaN(verseId)) continue;

        const versePath = path.join(chapterPath, verseFile);
        const content = fs.readFileSync(versePath, 'utf-8');
        const contentHash = computeHash(content);
        const contentKey = `${bibleValue}-${bookId}-${chapterId}-${verseId}`;

        // Check if content has changed
        if (!isFullImport && !hasContentChanged(db, 'word4word', contentKey, contentHash)) {
          stats.word4word.unchanged++;
          continue;
        }

        // Content changed - update
        const data = JSON.parse(content);
        deleteVerseWord4Word.run(bookId, chapterId, verseId, bibleValue);

        if (Array.isArray(data) && data[0]?.words) {
          for (const wordData of data[0].words) {
            insertWord4Word.run(
              bookId, chapterId, verseId,
              wordData.wordId,
              wordData.word,
              wordData.original || null,
              wordData.pronunciation || null,
              wordData.explanation || null,
              bibleValue
            );
          }
        }
        updateContentHash(db, 'word4word', contentKey, contentHash);
        stats.word4word.updated++;
      }
    }
  }
}

const languages = ['nb', 'nn'];
const originals = ['tanach', 'sblgnt'];
for (const original of originals) {
  for (const lang of languages) {
    console.log(`  Importerer word4word for ${original}/${lang}...`);
    importWord4Word(original, lang);
  }
}

// Importer referanser
console.log('Importerer referanser...');
const insertReference = db.prepare(`
  INSERT INTO references_ (from_book_id, from_chapter, from_verse, to_book_id, to_chapter, to_verse_start, to_verse_end, description, language)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const deleteVerseReferences = db.prepare(`
  DELETE FROM references_ WHERE from_book_id = ? AND from_chapter = ? AND from_verse = ? AND language = ?
`);

for (const lang of languages) {
  const refsPath = path.join(GENERATE_PATH, 'references', lang);
  if (!fs.existsSync(refsPath)) {
    console.log(`  Hopper over referanser for ${lang} (ikke funnet)`);
    continue;
  }

  console.log(`  Importerer referanser for ${lang}...`);
  const bookDirs = fs.readdirSync(refsPath).filter(f => !f.startsWith('.'));

  for (const bookDir of bookDirs) {
    const bookId = parseInt(bookDir);
    if (isNaN(bookId)) continue;

    const bookPath = path.join(refsPath, bookDir);
    const chapterDirs = fs.readdirSync(bookPath).filter(f => !f.startsWith('.'));

    for (const chapterDir of chapterDirs) {
      const chapterId = parseInt(chapterDir);
      if (isNaN(chapterId)) continue;

      const chapterPath = path.join(bookPath, chapterDir);
      const verseFiles = fs.readdirSync(chapterPath).filter(f => f.endsWith('.json'));

      for (const verseFile of verseFiles) {
        const verseId = parseInt(verseFile.replace('.json', ''));
        if (isNaN(verseId)) continue;

        const versePath = path.join(chapterPath, verseFile);
        const content = fs.readFileSync(versePath, 'utf-8');
        const contentHash = computeHash(content);
        const contentKey = `ref-${lang}-${bookId}-${chapterId}-${verseId}`;

        // Check if content has changed
        if (!isFullImport && !hasContentChanged(db, 'reference', contentKey, contentHash)) {
          stats.references.unchanged++;
          continue;
        }

        // Content changed - update
        const data = JSON.parse(content);
        deleteVerseReferences.run(bookId, chapterId, verseId, lang);

        if (data.references) {
          for (const ref of data.references) {
            const fromVerse = ref.fromVerseId;
            const toVerse = ref.toVerseId ?? fromVerse;

            if (fromVerse == null) {
              console.error(`Missing fromVerseId in ${versePath}:`, JSON.stringify(ref));
              process.exit(1);
            }

            try {
              insertReference.run(
                bookId, chapterId, verseId,
                ref.bookId, ref.chapterId,
                fromVerse, toVerse,
                ref.text || null,
                lang
              );
            } catch (e) {
              console.error(`Error importing reference from ${versePath}:`, JSON.stringify(ref), e);
              process.exit(1);
            }
          }
        }
        updateContentHash(db, 'reference', contentKey, contentHash);
        stats.references.updated++;
      }
    }
  }
}

// Importer boksammendrag
console.log('Importerer boksammendrag...');
const insertBookSummary = db.prepare(`
  INSERT OR REPLACE INTO book_summaries (book_id, summary) VALUES (?, ?)
`);

const bookSummariesPath = path.join(GENERATE_PATH, 'book_summaries', 'nb');
if (fs.existsSync(bookSummariesPath)) {
  const files = fs.readdirSync(bookSummariesPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const bookId = parseInt(file.replace('.md', ''));
    if (isNaN(bookId)) continue;

    const filePath = path.join(bookSummariesPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = String(bookId);

    if (!isFullImport && !hasContentChanged(db, 'book_summary', contentKey, contentHash)) {
      stats.bookSummaries.unchanged++;
      continue;
    }

    insertBookSummary.run(bookId, content);
    updateContentHash(db, 'book_summary', contentKey, contentHash);
    stats.bookSummaries.updated++;
  }
}

// Importer bokkontekst
console.log('Importerer bokkontekst...');
const insertBookContext = db.prepare(`
  INSERT OR REPLACE INTO book_context (book_id, context) VALUES (?, ?)
`);

const bookContextPath = path.join(GENERATE_PATH, 'book_context', 'nb');
if (fs.existsSync(bookContextPath)) {
  const files = fs.readdirSync(bookContextPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const bookId = parseInt(file.replace('.md', ''));
    if (isNaN(bookId)) continue;

    const filePath = path.join(bookContextPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = String(bookId);

    if (!isFullImport && !hasContentChanged(db, 'book_context', contentKey, contentHash)) {
      stats.bookContext.unchanged++;
      continue;
    }

    insertBookContext.run(bookId, content);
    updateContentHash(db, 'book_context', contentKey, contentHash);
    stats.bookContext.updated++;
  }
}

// Importer kapittelsammendrag
console.log('Importerer kapittelsammendrag...');
const insertChapterSummary = db.prepare(`
  INSERT OR REPLACE INTO chapter_summaries (book_id, chapter, summary) VALUES (?, ?, ?)
`);

const chapterSummariesPath = path.join(GENERATE_PATH, 'chapter_summaries', 'nb');
if (fs.existsSync(chapterSummariesPath)) {
  const files = fs.readdirSync(chapterSummariesPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.md$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);

    const filePath = path.join(chapterSummariesPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}`;

    if (!isFullImport && !hasContentChanged(db, 'chapter_summary', contentKey, contentHash)) {
      stats.chapterSummaries.unchanged++;
      continue;
    }

    insertChapterSummary.run(bookId, chapter, content);
    updateContentHash(db, 'chapter_summary', contentKey, contentHash);
    stats.chapterSummaries.updated++;
  }
}

// Importer kapittelkontekst
console.log('Importerer kapittelkontekst...');
const insertChapterContext = db.prepare(`
  INSERT OR REPLACE INTO chapter_context (book_id, chapter, context) VALUES (?, ?, ?)
`);

const chapterContextPath = path.join(GENERATE_PATH, 'chapter_context', 'nb');
if (fs.existsSync(chapterContextPath)) {
  const files = fs.readdirSync(chapterContextPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.md$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);

    const filePath = path.join(chapterContextPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}`;

    if (!isFullImport && !hasContentChanged(db, 'chapter_context', contentKey, contentHash)) {
      stats.chapterContext.unchanged++;
      continue;
    }

    insertChapterContext.run(bookId, chapter, content);
    updateContentHash(db, 'chapter_context', contentKey, contentHash);
    stats.chapterContext.updated++;
  }
}

// Importer viktige ord
console.log('Importerer viktige ord...');
const insertImportantWord = db.prepare(`
  INSERT INTO important_words (book_id, chapter, word, explanation) VALUES (?, ?, ?, ?)
`);
const deleteChapterImportantWords = db.prepare(`
  DELETE FROM important_words WHERE book_id = ? AND chapter = ?
`);

const importantWordsPath = path.join(GENERATE_PATH, 'important_words', 'nb');
if (fs.existsSync(importantWordsPath)) {
  const files = fs.readdirSync(importantWordsPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.txt$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);

    const filePath = path.join(importantWordsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}`;

    if (!isFullImport && !hasContentChanged(db, 'important_words', contentKey, contentHash)) {
      stats.importantWords.unchanged++;
      continue;
    }

    deleteChapterImportantWords.run(bookId, chapter);
    for (const line of content.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const word = line.substring(0, colonIdx).trim();
        const explanation = line.substring(colonIdx + 1).trim();
        if (word && explanation) {
          insertImportantWord.run(bookId, chapter, word, explanation);
        }
      }
    }
    updateContentHash(db, 'important_words', contentKey, contentHash);
    stats.importantWords.updated++;
  }
}

// Importer vers-bønn
console.log('Importerer vers-bønn...');
const insertVersePrayer = db.prepare(`
  INSERT OR REPLACE INTO verse_prayers (book_id, chapter, verse, prayer) VALUES (?, ?, ?, ?)
`);

const versePrayerPath = path.join(GENERATE_PATH, 'verse_prayer', 'nb');
if (fs.existsSync(versePrayerPath)) {
  const files = fs.readdirSync(versePrayerPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)-(\d+)\.txt$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr, verseStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStr);

    const filePath = path.join(versePrayerPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}-${verse}`;

    if (!isFullImport && !hasContentChanged(db, 'verse_prayer', contentKey, contentHash)) {
      stats.versePrayers.unchanged++;
      continue;
    }

    insertVersePrayer.run(bookId, chapter, verse, content);
    updateContentHash(db, 'verse_prayer', contentKey, contentHash);
    stats.versePrayers.updated++;
  }
}

// Importer vers-andakt
console.log('Importerer vers-andakt...');
const insertVerseSermon = db.prepare(`
  INSERT OR REPLACE INTO verse_sermons (book_id, chapter, verse, sermon) VALUES (?, ?, ?, ?)
`);

const verseSermonPath = path.join(GENERATE_PATH, 'verse_sermon', 'nb');
if (fs.existsSync(verseSermonPath)) {
  const files = fs.readdirSync(verseSermonPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)-(\d+)\.txt$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr, verseStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStr);

    const filePath = path.join(verseSermonPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}-${verse}`;

    if (!isFullImport && !hasContentChanged(db, 'verse_sermon', contentKey, contentHash)) {
      stats.verseSermons.unchanged++;
      continue;
    }

    insertVerseSermon.run(bookId, chapter, verse, content);
    updateContentHash(db, 'verse_sermon', contentKey, contentHash);
    stats.verseSermons.updated++;
  }
}

// Importer viktige vers (always full import - small file)
console.log('Importerer viktige vers...');
const insertImportantVerse = db.prepare(`
  INSERT OR REPLACE INTO important_verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)
`);

const bookNameMap: Record<string, number> = {
  'Filipperne': 50,
  'Romerne': 45,
  'Matt': 40,
  'Matteus': 40,
  'Josva': 6,
  'Jeremia': 24,
  'Salme': 19,
  'Salmene': 19,
  '1 Korinter': 46,
  'Efeserne': 49,
  'Galaterne': 48,
  'Johannes': 43,
  '2 Timoteus': 55,
  'Hebreerne': 58,
  '1 Peter': 60,
  '2 Korinter': 47,
  'Apostlenes gjerninger': 44,
  '1 Johannes': 62,
  'Jakob': 59,
  'Lukas': 42,
  'Isaiah': 23,
  'Jesaja': 23,
};

const importantVersesPath = path.join(GENERATE_PATH, 'important_verses', 'verses.txt');
if (fs.existsSync(importantVersesPath)) {
  const content = fs.readFileSync(importantVersesPath, 'utf-8');

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;

    const textMatch = line.match(/"([^"]+)"/);
    const text = textMatch ? textMatch[1] : null;

    const numericMatch = line.match(/^(\d+):(\d+):(\d+)/);
    if (numericMatch) {
      const [, bookIdStr, chapterStr, verseStr] = numericMatch;
      insertImportantVerse.run(parseInt(bookIdStr), parseInt(chapterStr), parseInt(verseStr), text);
      continue;
    }

    const nameMatch = line.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (nameMatch) {
      const [, bookName, chapterStr, verseStartStr, verseEndStr] = nameMatch;
      const bookId = bookNameMap[bookName.trim()];

      if (bookId) {
        insertImportantVerse.run(bookId, parseInt(chapterStr), parseInt(verseStartStr), text);

        if (verseEndStr) {
          for (let v = parseInt(verseStartStr) + 1; v <= parseInt(verseEndStr); v++) {
            insertImportantVerse.run(bookId, parseInt(chapterStr), v, text);
          }
        }
      } else {
        console.log(`  Ukjent bok: ${bookName}`);
      }
    }
  }
}

// Importer temaer
console.log('Importerer temaer...');
const insertTheme = db.prepare(`
  INSERT OR REPLACE INTO themes (name, content) VALUES (?, ?)
`);

const themesPath = path.join(GENERATE_PATH, 'themes', 'nb');
if (fs.existsSync(themesPath)) {
  const jsonFiles = fs.readdirSync(themesPath).filter(f => f.endsWith('.json'));
  const txtFiles = fs.readdirSync(themesPath).filter(f => f.endsWith('.txt'));

  for (const file of jsonFiles) {
    const name = file.replace('.json', '');
    const filePath = path.join(themesPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = name;

    if (!isFullImport && !hasContentChanged(db, 'theme', contentKey, contentHash)) {
      stats.themes.unchanged++;
      continue;
    }

    try {
      JSON.parse(content);
      insertTheme.run(name, content);
      updateContentHash(db, 'theme', contentKey, contentHash);
      stats.themes.updated++;
    } catch (e) {
      console.error(`Ugyldig JSON i ${file}:`, e);
    }
  }

  for (const file of txtFiles) {
    const name = file.replace('.txt', '');
    const filePath = path.join(themesPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = name;

    if (!isFullImport && !hasContentChanged(db, 'theme', contentKey, contentHash)) {
      stats.themes.unchanged++;
      continue;
    }

    insertTheme.run(name, content);
    updateContentHash(db, 'theme', contentKey, contentHash);
    stats.themes.updated++;
  }
}

// Importer tidslinje (bible, world, books)
console.log('Importerer tidslinje...');
const insertTimelinePeriod = db.prepare(`
  INSERT OR REPLACE INTO timeline_periods (id, timeline_type, name, color, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)
`);
const insertTimelineEvent = db.prepare(`
  INSERT OR REPLACE INTO timeline_events (id, title, description, year, year_display, period_id, importance, sort_order, timeline_type, region, book_id, section_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertTimelineReference = db.prepare(`
  INSERT INTO timeline_references (event_id, book_id, chapter, verse_start, verse_end) VALUES (?, ?, ?, ?, ?)
`);
const insertTimelineBookSection = db.prepare(`
  INSERT OR REPLACE INTO timeline_book_sections (id, book_id, title, chapter_start, chapter_end, description, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const deleteTimelineReferences = db.prepare(`DELETE FROM timeline_references`);
const deleteTimelineEvents = db.prepare(`DELETE FROM timeline_events`);
const deleteTimelinePeriods = db.prepare(`DELETE FROM timeline_periods`);
const deleteTimelineBookSections = db.prepare(`DELETE FROM timeline_book_sections`);

const timelineBaseDir = path.join(GENERATE_PATH, 'timeline', 'nb');

function readAllTimelineFiles(): string {
  let combined = '';
  const dirs = ['events', 'world', 'books'];
  for (const dir of dirs) {
    const dirPath = path.join(timelineBaseDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort();
      for (const file of files) {
        combined += fs.readFileSync(path.join(dirPath, file), 'utf-8');
      }
    }
  }
  return combined;
}

function importTimelineType(type: 'bible' | 'world', subDir: string) {
  const dirPath = path.join(timelineBaseDir, subDir);
  const periodsFile = path.join(dirPath, 'periods.json');
  if (!fs.existsSync(periodsFile)) return { periods: 0, events: 0 };

  const periodsData = JSON.parse(fs.readFileSync(periodsFile, 'utf-8'));
  let periodOrder = 0;
  for (const period of periodsData.periods) {
    insertTimelinePeriod.run(
      period.id,
      type,
      period.name,
      period.color || null,
      period.description || null,
      periodOrder++
    );
  }

  let totalEvents = 0;
  for (const period of periodsData.periods) {
    if (period.eventsFile) {
      // eventsFile is like "events/creation.json" or "world/creation.json" - extract just the filename
      const eventFileName = path.basename(period.eventsFile);
      const eventsPath = path.join(dirPath, eventFileName);
      if (fs.existsSync(eventsPath)) {
        const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
        if (eventsData.events) {
          for (const event of eventsData.events) {
            insertTimelineEvent.run(
              event.id,
              event.title,
              event.description || null,
              event.year || null,
              event.year_display || null,
              event.period || null,
              event.importance || 'minor',
              event.sort_order,
              type,
              event.region || null,
              null,
              null
            );

            if (event.references && event.references.length > 0) {
              for (const ref of event.references) {
                const verseStart = ref.verseStart ?? ref.verse ?? 1;
                const verseEnd = ref.verseEnd ?? ref.verse ?? verseStart;
                insertTimelineReference.run(event.id, ref.book, ref.chapter, verseStart, verseEnd);
              }
            }
            totalEvents++;
          }
        }
      }
    }
  }

  return { periods: periodsData.periods.length, events: totalEvents };
}

function importBookTimelines() {
  const booksDir = path.join(timelineBaseDir, 'books');
  if (!fs.existsSync(booksDir)) return { books: 0, sections: 0, events: 0 };

  const bookFiles = fs.readdirSync(booksDir).filter(f => f.endsWith('.json')).sort((a, b) => {
    return parseInt(a.replace('.json', '')) - parseInt(b.replace('.json', ''));
  });

  let totalSections = 0;
  let totalEvents = 0;

  for (const file of bookFiles) {
    const filePath = path.join(booksDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const bookId = data.book;

    // Import sections
    if (data.sections) {
      let sectionOrder = 0;
      for (const section of data.sections) {
        insertTimelineBookSection.run(
          section.id,
          bookId,
          section.title,
          section.chapter_start,
          section.chapter_end,
          section.description || null,
          sectionOrder++
        );
        totalSections++;
      }
    }

    // Import events
    if (data.events) {
      for (const event of data.events) {
        insertTimelineEvent.run(
          event.id,
          event.title,
          event.description || null,
          event.year || null,
          event.year_display || null,
          null,
          event.importance || 'minor',
          event.sort_order,
          'books',
          null,
          bookId,
          event.section || null
        );

        if (event.references && event.references.length > 0) {
          for (const ref of event.references) {
            const verseStart = ref.verseStart ?? ref.verse ?? 1;
            const verseEnd = ref.verseEnd ?? ref.verse ?? verseStart;
            insertTimelineReference.run(event.id, bookId, ref.chapter, verseStart, verseEnd);
          }
        }
        totalEvents++;
      }
    }
  }

  return { books: bookFiles.length, sections: totalSections, events: totalEvents };
}

if (fs.existsSync(timelineBaseDir)) {
  const combinedContent = readAllTimelineFiles();
  const contentHash = computeHash(combinedContent);

  if (isFullImport || hasContentChanged(db, 'timeline', 'data', contentHash)) {
    // Clear existing timeline data
    deleteTimelineReferences.run();
    deleteTimelineEvents.run();
    deleteTimelinePeriods.run();
    deleteTimelineBookSections.run();

    // Import bible timeline
    const bible = importTimelineType('bible', 'events');
    console.log(`  Bibel: ${bible.periods} perioder, ${bible.events} hendelser`);

    // Import world timeline
    const world = importTimelineType('world', 'world');
    console.log(`  Verden: ${world.periods} perioder, ${world.events} hendelser`);

    // Import book timelines
    const bookResult = importBookTimelines();
    console.log(`  Bøker: ${bookResult.books} bøker, ${bookResult.sections} seksjoner, ${bookResult.events} hendelser`);

    const totalEvents = bible.events + world.events + bookResult.events;
    updateContentHash(db, 'timeline', 'data', contentHash);
    stats.timeline.updated = totalEvents;
  } else {
    const eventCount = db.prepare('SELECT COUNT(*) as count FROM timeline_events').get() as { count: number };
    console.log(`  Uendret (${eventCount.count} hendelser totalt)`);
    stats.timeline.unchanged = eventCount.count;
  }
}

// Importer profetier
console.log('Importerer profetier...');
const insertProphecyCategory = db.prepare(`
  INSERT OR REPLACE INTO prophecy_categories (id, name, description) VALUES (?, ?, ?)
`);
const insertProphecy = db.prepare(`
  INSERT OR REPLACE INTO prophecies (id, category_id, title, explanation, prophecy_book_id, prophecy_chapter, prophecy_verse_start, prophecy_verse_end)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertProphecyFulfillment = db.prepare(`
  INSERT INTO prophecy_fulfillments (prophecy_id, book_id, chapter, verse_start, verse_end) VALUES (?, ?, ?, ?, ?)
`);
const deleteProphecyFulfillments = db.prepare(`DELETE FROM prophecy_fulfillments`);
const deleteProphecies = db.prepare(`DELETE FROM prophecies`);
const deleteProphecyCategories = db.prepare(`DELETE FROM prophecy_categories`);

const propheciesPath = path.join(GENERATE_PATH, 'prophecies', 'prophecies.json');
if (fs.existsSync(propheciesPath)) {
  const content = fs.readFileSync(propheciesPath, 'utf-8');
  const contentHash = computeHash(content);

  if (isFullImport || hasContentChanged(db, 'prophecies', 'data', contentHash)) {
    const prophecyData = JSON.parse(content);

    // Clear existing prophecy data
    deleteProphecyFulfillments.run();
    deleteProphecies.run();
    deleteProphecyCategories.run();

    if (prophecyData.categories) {
      for (const category of prophecyData.categories) {
        insertProphecyCategory.run(
          category.id,
          category.name,
          category.description || null
        );
      }
      console.log(`  Importerte ${prophecyData.categories.length} kategorier`);
    }

    if (prophecyData.prophecies) {
      for (const prophecy of prophecyData.prophecies) {
        insertProphecy.run(
          prophecy.id,
          prophecy.category,
          prophecy.title,
          prophecy.explanation || null,
          prophecy.prophecy.bookId,
          prophecy.prophecy.chapter,
          prophecy.prophecy.verseStart,
          prophecy.prophecy.verseEnd
        );

        if (prophecy.fulfillments && prophecy.fulfillments.length > 0) {
          for (const fulfillment of prophecy.fulfillments) {
            insertProphecyFulfillment.run(
              prophecy.id,
              fulfillment.bookId,
              fulfillment.chapter,
              fulfillment.verseStart,
              fulfillment.verseEnd
            );
          }
        }
      }
      console.log(`  Importerte ${prophecyData.prophecies.length} profetier`);
    }

    updateContentHash(db, 'prophecies', 'data', contentHash);
    stats.prophecies.updated++;
  } else {
    stats.prophecies.unchanged++;
  }
}

// Importer personer
console.log('Importerer personer...');
const insertPerson = db.prepare(`
  INSERT OR REPLACE INTO persons (name, content) VALUES (?, ?)
`);

const personsPath = path.join(GENERATE_PATH, 'persons', 'nb');
if (fs.existsSync(personsPath)) {
  const files = fs.readdirSync(personsPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const name = file.replace('.json', '');
    const filePath = path.join(personsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = name;

    if (!isFullImport && !hasContentChanged(db, 'person', contentKey, contentHash)) {
      stats.persons.unchanged++;
      continue;
    }

    try {
      JSON.parse(content);
      insertPerson.run(name, content);
      updateContentHash(db, 'person', contentKey, contentHash);
      stats.persons.updated++;
    } catch (e) {
      console.error(`Ugyldig JSON i ${file}:`, e);
    }
  }
  console.log(`  Importerte ${stats.persons.updated} personer`);
}

// Importer kapittel-innsikter
console.log('Importerer kapittel-innsikter...');
const insertChapterInsight = db.prepare(`
  INSERT OR REPLACE INTO chapter_insights (book_id, chapter, type, content) VALUES (?, ?, ?, ?)
`);

const chapterInsightsPath = path.join(GENERATE_PATH, 'chapter_insights', 'nb');
if (fs.existsSync(chapterInsightsPath)) {
  const files = fs.readdirSync(chapterInsightsPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.json$/);
    if (!match) continue;

    const [, bookIdStr, chapterStr] = match;
    const bookId = parseInt(bookIdStr);
    const chapter = parseInt(chapterStr);

    const filePath = path.join(chapterInsightsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = `${bookId}-${chapter}`;

    if (!isFullImport && !hasContentChanged(db, 'chapter_insight', contentKey, contentHash)) {
      stats.chapterInsights.unchanged++;
      continue;
    }

    try {
      const insight = JSON.parse(content);
      insertChapterInsight.run(bookId, chapter, insight.type, content);
      updateContentHash(db, 'chapter_insight', contentKey, contentHash);
      stats.chapterInsights.updated++;
    } catch (e) {
      console.error(`Ugyldig JSON i ${file}:`, e);
    }
  }
  console.log(`  Importerte ${stats.chapterInsights.updated} kapittel-innsikter`);
}

// Importer dagens vers
console.log('Importerer dagens vers...');
const insertDailyVerse = db.prepare(`
  INSERT OR REPLACE INTO daily_verses (date, book_id, chapter, verse_start, verse_end, note)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const dailyVersePath = path.join(GENERATE_PATH, 'daily_verse');
if (fs.existsSync(dailyVersePath)) {
  const yearFiles = fs.readdirSync(dailyVersePath).filter(f => f.endsWith('.json'));

  for (const file of yearFiles) {
    const filePath = path.join(dailyVersePath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = file.replace('.json', '');

    if (!isFullImport && !hasContentChanged(db, 'daily_verse', contentKey, contentHash)) {
      stats.dailyVerses.unchanged++;
      continue;
    }

    const yearData = JSON.parse(content);

    if (yearData.verses) {
      for (const verse of yearData.verses) {
        // Parse ref format: "book:chapter:verse" or "book:chapter:verseStart-verseEnd"
        const refParts = verse.ref.split(':');
        const bookId = parseInt(refParts[0]);
        const chapter = parseInt(refParts[1]);
        const versePart = refParts[2];

        let verseStart: number;
        let verseEnd: number;

        if (versePart.includes('-')) {
          const [start, end] = versePart.split('-');
          verseStart = parseInt(start);
          verseEnd = parseInt(end);
        } else {
          verseStart = parseInt(versePart);
          verseEnd = verseStart;
        }

        insertDailyVerse.run(verse.date, bookId, chapter, verseStart, verseEnd, verse.note || null);
      }
    }

    updateContentHash(db, 'daily_verse', contentKey, contentHash);
    stats.dailyVerses.updated++;
  }
  console.log(`  Importerte ${stats.dailyVerses.updated} årsfiler (${stats.dailyVerses.unchanged} uendret)`);
}

// Importer leseplaner
console.log('Importerer leseplaner...');
const insertReadingPlan = db.prepare(`
  INSERT OR REPLACE INTO reading_plans (id, name, description, category, days, content)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const readingPlansPath = path.join(GENERATE_PATH, 'reading_plans');
if (fs.existsSync(readingPlansPath)) {
  const planFiles = fs.readdirSync(readingPlansPath).filter(f => f.endsWith('.json') && f !== 'index.json');

  for (const file of planFiles) {
    const filePath = path.join(readingPlansPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const contentKey = file.replace('.json', '');

    if (!isFullImport && !hasContentChanged(db, 'reading_plan', contentKey, contentHash)) {
      stats.readingPlans.unchanged++;
      continue;
    }

    try {
      const plan = JSON.parse(content);
      insertReadingPlan.run(
        plan.id,
        plan.name,
        plan.description || null,
        plan.category || null,
        plan.days,
        content
      );
      updateContentHash(db, 'reading_plan', contentKey, contentHash);
      stats.readingPlans.updated++;
    } catch (e) {
      console.error(`Ugyldig JSON i ${file}:`, e);
    }
  }
  console.log(`  Importerte ${stats.readingPlans.updated} leseplaner (${stats.readingPlans.unchanged} uendret)`);
}

// Importer evangelieparalleller
console.log('Importerer evangelieparalleller...');
const insertGospelParallelSection = db.prepare(`
  INSERT OR REPLACE INTO gospel_parallel_sections (id, name, description, sort_order) VALUES (?, ?, ?, ?)
`);
const insertGospelParallel = db.prepare(`
  INSERT OR REPLACE INTO gospel_parallels (id, section_id, title, notes, sort_order) VALUES (?, ?, ?, ?, ?)
`);
const insertGospelParallelPassage = db.prepare(`
  INSERT INTO gospel_parallel_passages (parallel_id, gospel, book_id, chapter, verse_start, verse_end, reference)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const deleteGospelParallelPassages = db.prepare(`DELETE FROM gospel_parallel_passages`);
const deleteGospelParallels = db.prepare(`DELETE FROM gospel_parallels`);
const deleteGospelParallelSections = db.prepare(`DELETE FROM gospel_parallel_sections`);

const gospelParallelsPath = path.join(GENERATE_PATH, 'gospel_parallels', 'parallels.json');
if (fs.existsSync(gospelParallelsPath)) {
  const content = fs.readFileSync(gospelParallelsPath, 'utf-8');
  const contentHash = computeHash(content);

  if (isFullImport || hasContentChanged(db, 'gospel_parallels', 'data', contentHash)) {
    const data = JSON.parse(content);

    // Clear existing data
    deleteGospelParallelPassages.run();
    deleteGospelParallels.run();
    deleteGospelParallelSections.run();

    // Import sections
    if (data.sections) {
      let sectionOrder = 0;
      for (const section of data.sections) {
        insertGospelParallelSection.run(
          section.id,
          section.name,
          section.description || null,
          sectionOrder++
        );
      }
      console.log(`  Importerte ${data.sections.length} seksjoner`);
    }

    // Import parallels
    if (data.parallels) {
      let parallelOrder = 0;
      for (const parallel of data.parallels) {
        insertGospelParallel.run(
          parallel.id,
          parallel.section,
          parallel.title,
          parallel.notes || null,
          parallelOrder++
        );

        // Import passages
        if (parallel.passages) {
          for (const [gospel, passage] of Object.entries(parallel.passages)) {
            const p = passage as { bookId: number; chapter: number; verseStart: number; verseEnd: number; reference: string };
            insertGospelParallelPassage.run(
              parallel.id,
              gospel,
              p.bookId,
              p.chapter,
              p.verseStart,
              p.verseEnd,
              p.reference
            );
          }
        }
      }
      console.log(`  Importerte ${data.parallels.length} paralleller`);
    }

    updateContentHash(db, 'gospel_parallels', 'data', contentHash);
    stats.gospelParallels.updated = data.parallels?.length || 0;
  } else {
    const parallelCount = db.prepare('SELECT COUNT(*) as count FROM gospel_parallels').get() as { count: number };
    console.log(`  Uendret (${parallelCount.count} paralleller)`);
    stats.gospelParallels.unchanged = parallelCount.count;
  }
}

// Importer vers-mappinger
console.log('Importerer vers-mappinger...');
const insertMapping = db.prepare(`
  INSERT OR REPLACE INTO verse_mappings (id, name, description, book_names, verse_map, unmapped)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const mappingsPath = path.join(GENERATE_PATH, 'mappings');
if (fs.existsSync(mappingsPath)) {
  const files = fs.readdirSync(mappingsPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(mappingsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = computeHash(content);
    const mappingId = file.replace('.json', '');

    if (!isFullImport && !hasContentChanged(db, 'verse_mapping', mappingId, contentHash)) {
      stats.verseMappings.unchanged++;
      continue;
    }

    try {
      const data = JSON.parse(content);
      insertMapping.run(
        data.id || mappingId,
        data.name || mappingId,
        data.description || null,
        JSON.stringify(data.bookNames),
        JSON.stringify(data.verseMap),
        data.unmapped ? JSON.stringify(data.unmapped) : null
      );
      updateContentHash(db, 'verse_mapping', mappingId, contentHash);
      stats.verseMappings.updated++;
    } catch (e) {
      console.error(`Ugyldig JSON i ${file}:`, e);
    }
  }
  console.log(`  Importerte ${stats.verseMappings.updated} vers-mappinger`);
} else {
  console.log('  Ingen mappinger-mappe funnet');
}

// Opprett indekser
console.log('Oppretter indekser...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_verses_bible ON verses(bible);
  CREATE INDEX IF NOT EXISTS idx_word4word_verse ON word4word(book_id, chapter, verse, bible);
  CREATE INDEX IF NOT EXISTS idx_references_from ON references_(from_book_id, from_chapter, from_verse, language);
  CREATE INDEX IF NOT EXISTS idx_important_words_chapter ON important_words(book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_period ON timeline_events(period_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_sort ON timeline_events(sort_order);
  CREATE INDEX IF NOT EXISTS idx_timeline_references_event ON timeline_references(event_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(timeline_type);
  CREATE INDEX IF NOT EXISTS idx_timeline_events_book ON timeline_events(book_id);
  CREATE INDEX IF NOT EXISTS idx_timeline_book_sections_book ON timeline_book_sections(book_id);
  CREATE INDEX IF NOT EXISTS idx_prophecies_category ON prophecies(category_id);
  CREATE INDEX IF NOT EXISTS idx_prophecy_fulfillments_prophecy ON prophecy_fulfillments(prophecy_id);
  CREATE INDEX IF NOT EXISTS idx_prophecy_fulfillments_book ON prophecy_fulfillments(book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_chapter_insights_book ON chapter_insights(book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_daily_verses_date ON daily_verses(date);
  CREATE INDEX IF NOT EXISTS idx_gospel_parallels_section ON gospel_parallels(section_id);
  CREATE INDEX IF NOT EXISTS idx_gospel_parallel_passages_parallel ON gospel_parallel_passages(parallel_id);
`);

// Check if any content was updated
const totalUpdated = Object.values(stats).reduce((sum, s) => sum + s.updated, 0);
const totalUnchanged = Object.values(stats).reduce((sum, s) => sum + s.unchanged, 0);

// Only increment sync version if something changed
if (totalUpdated > 0 || isFullImport) {
  const newSyncVersion = incrementSyncVersion(db);

  // Store timestamp for this version
  const insertMeta = db.prepare(`INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)`);
  const now = new Date();
  const version = now.toISOString().replace('T', ' ').substring(0, 19);
  insertMeta.run('version', version);
  insertMeta.run('imported_at', now.toISOString());
  insertMeta.run(`version_${newSyncVersion}`, now.toISOString());
  console.log(`\nSync-versjon: ${newSyncVersion}`);
  console.log(`Database-versjon: ${version}`);
} else {
  const currentVersion = getSyncVersion(db);
  console.log(`\nIngen endringer - sync-versjon forblir: ${currentVersion}`);
}

db.close();

// Print summary
console.log('\n=== Import-sammendrag ===');
console.log(`Modus: ${isFullImport ? 'Full reimport' : 'Inkrementell'}`);
console.log('');
console.log('Innholdstype          Oppdatert  Uendret');
console.log('----------------------------------------');
console.log(`Kapitler              ${String(stats.chapters.updated).padStart(9)}  ${String(stats.chapters.unchanged).padStart(7)}`);
console.log(`Word4word             ${String(stats.word4word.updated).padStart(9)}  ${String(stats.word4word.unchanged).padStart(7)}`);
console.log(`Referanser            ${String(stats.references.updated).padStart(9)}  ${String(stats.references.unchanged).padStart(7)}`);
console.log(`Boksammendrag         ${String(stats.bookSummaries.updated).padStart(9)}  ${String(stats.bookSummaries.unchanged).padStart(7)}`);
console.log(`Bokkontekst           ${String(stats.bookContext.updated).padStart(9)}  ${String(stats.bookContext.unchanged).padStart(7)}`);
console.log(`Kapittelsammendrag    ${String(stats.chapterSummaries.updated).padStart(9)}  ${String(stats.chapterSummaries.unchanged).padStart(7)}`);
console.log(`Kapittelkontekst      ${String(stats.chapterContext.updated).padStart(9)}  ${String(stats.chapterContext.unchanged).padStart(7)}`);
console.log(`Viktige ord           ${String(stats.importantWords.updated).padStart(9)}  ${String(stats.importantWords.unchanged).padStart(7)}`);
console.log(`Vers-bønn             ${String(stats.versePrayers.updated).padStart(9)}  ${String(stats.versePrayers.unchanged).padStart(7)}`);
console.log(`Vers-andakt           ${String(stats.verseSermons.updated).padStart(9)}  ${String(stats.verseSermons.unchanged).padStart(7)}`);
console.log(`Temaer                ${String(stats.themes.updated).padStart(9)}  ${String(stats.themes.unchanged).padStart(7)}`);
console.log(`Tidslinje             ${String(stats.timeline.updated).padStart(9)}  ${String(stats.timeline.unchanged).padStart(7)}`);
console.log(`Profetier             ${String(stats.prophecies.updated).padStart(9)}  ${String(stats.prophecies.unchanged).padStart(7)}`);
console.log(`Personer              ${String(stats.persons.updated).padStart(9)}  ${String(stats.persons.unchanged).padStart(7)}`);
console.log(`Kapittel-innsikter    ${String(stats.chapterInsights.updated).padStart(9)}  ${String(stats.chapterInsights.unchanged).padStart(7)}`);
console.log(`Dagens vers           ${String(stats.dailyVerses.updated).padStart(9)}  ${String(stats.dailyVerses.unchanged).padStart(7)}`);
console.log(`Leseplaner            ${String(stats.readingPlans.updated).padStart(9)}  ${String(stats.readingPlans.unchanged).padStart(7)}`);
console.log(`Evangelieparalleller  ${String(stats.gospelParallels.updated).padStart(9)}  ${String(stats.gospelParallels.unchanged).padStart(7)}`);
console.log(`Vers-mappinger        ${String(stats.verseMappings.updated).padStart(9)}  ${String(stats.verseMappings.unchanged).padStart(7)}`);
console.log('----------------------------------------');
console.log(`Totalt                ${String(totalUpdated).padStart(9)}  ${String(totalUnchanged).padStart(7)}`);
console.log('\nFerdig!');
