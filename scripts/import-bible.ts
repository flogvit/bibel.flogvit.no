import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const GENERATE_PATH = path.join(process.cwd(), '..', 'free-bible', 'generate');
const DB_PATH = path.join(process.cwd(), 'data', 'bible.db');

// Sørg for at data-mappen eksisterer
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Slett eksisterende database og opprett ny
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
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
    bible TEXT NOT NULL DEFAULT 'osnb1',
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
    bible TEXT NOT NULL DEFAULT 'osnb1',
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
    FOREIGN KEY (from_book_id) REFERENCES books(id),
    FOREIGN KEY (to_book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS book_summaries (
    book_id INTEGER PRIMARY KEY,
    summary TEXT NOT NULL,
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
`);

// Importer bøker
console.log('Importerer bøker...');
const insertBook = db.prepare(`
  INSERT INTO books (id, name, name_no, short_name, testament, chapters)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const book of books) {
  insertBook.run(book.id, book.name, book.name_no, book.short_name, book.testament, book.chapters);
}

// Importer vers
console.log('Importerer vers...');
const insertVerse = db.prepare(`
  INSERT OR REPLACE INTO verses (book_id, chapter, verse, text, bible)
  VALUES (?, ?, ?, ?, ?)
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
      const verses = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

      for (const v of verses) {
        insertVerse.run(v.bookId, v.chapterId, v.verseId, v.text, bible);
      }
    }
  }
}

console.log('  Importerer osnb1...');
importVerses('osnb1');
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

function importWord4Word(bible: string) {
  const word4wordPath = path.join(GENERATE_PATH, 'word4word', bible);
  if (!fs.existsSync(word4wordPath)) {
    console.log(`  Hopper over word4word for ${bible} (ikke funnet)`);
    return;
  }

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
        const data = JSON.parse(fs.readFileSync(versePath, 'utf-8'));

        if (Array.isArray(data) && data[0]?.words) {
          for (const wordData of data[0].words) {
            insertWord4Word.run(
              bookId, chapterId, verseId,
              wordData.wordId,
              wordData.word,
              wordData.original || null,
              wordData.pronunciation || null,
              wordData.explanation || null,
              bible
            );
          }
        }
      }
    }
  }
}

console.log('  Importerer word4word for osnb1...');
importWord4Word('osnb1');
console.log('  Importerer word4word for osnn1...');
importWord4Word('osnn1');
console.log('  Importerer word4word for sblgnt...');
importWord4Word('sblgnt');
console.log('  Importerer word4word for tanach...');
importWord4Word('tanach');

// Importer referanser
console.log('Importerer referanser...');
const insertReference = db.prepare(`
  INSERT INTO references_ (from_book_id, from_chapter, from_verse, to_book_id, to_chapter, to_verse_start, to_verse_end, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const refsPath = path.join(GENERATE_PATH, 'references');
if (fs.existsSync(refsPath)) {
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
        const data = JSON.parse(fs.readFileSync(versePath, 'utf-8'));

        if (data.references) {
          for (const ref of data.references) {
            insertReference.run(
              bookId, chapterId, verseId,
              ref.bookId, ref.chapterId,
              ref.fromVerseId, ref.toVerseId || ref.fromVerseId,
              ref.text || null
            );
          }
        }
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
  const files = fs.readdirSync(bookSummariesPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const bookId = parseInt(file.replace('.txt', ''));
    if (isNaN(bookId)) continue;

    const summary = fs.readFileSync(path.join(bookSummariesPath, file), 'utf-8');
    insertBookSummary.run(bookId, summary);
  }
}

// Importer kapittelsammendrag
console.log('Importerer kapittelsammendrag...');
const insertChapterSummary = db.prepare(`
  INSERT OR REPLACE INTO chapter_summaries (book_id, chapter, summary) VALUES (?, ?, ?)
`);

const chapterSummariesPath = path.join(GENERATE_PATH, 'chapter_summaries', 'nb');
if (fs.existsSync(chapterSummariesPath)) {
  const files = fs.readdirSync(chapterSummariesPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.txt$/);
    if (!match) continue;

    const [, bookId, chapter] = match;
    const summary = fs.readFileSync(path.join(chapterSummariesPath, file), 'utf-8');
    insertChapterSummary.run(parseInt(bookId), parseInt(chapter), summary);
  }
}

// Importer viktige ord
console.log('Importerer viktige ord...');
const insertImportantWord = db.prepare(`
  INSERT INTO important_words (book_id, chapter, word, explanation) VALUES (?, ?, ?, ?)
`);

const importantWordsPath = path.join(GENERATE_PATH, 'important_words', 'nb');
if (fs.existsSync(importantWordsPath)) {
  const files = fs.readdirSync(importantWordsPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const match = file.match(/^(\d+)-(\d+)\.txt$/);
    if (!match) continue;

    const [, bookId, chapter] = match;
    const content = fs.readFileSync(path.join(importantWordsPath, file), 'utf-8');

    for (const line of content.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const word = line.substring(0, colonIdx).trim();
        const explanation = line.substring(colonIdx + 1).trim();
        if (word && explanation) {
          insertImportantWord.run(parseInt(bookId), parseInt(chapter), word, explanation);
        }
      }
    }
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

    const [, bookId, chapter, verse] = match;
    const prayer = fs.readFileSync(path.join(versePrayerPath, file), 'utf-8');
    insertVersePrayer.run(parseInt(bookId), parseInt(chapter), parseInt(verse), prayer);
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

    const [, bookId, chapter, verse] = match;
    const sermon = fs.readFileSync(path.join(verseSermonPath, file), 'utf-8');
    insertVerseSermon.run(parseInt(bookId), parseInt(chapter), parseInt(verse), sermon);
  }
}

// Importer viktige vers
console.log('Importerer viktige vers...');
const insertImportantVerse = db.prepare(`
  INSERT OR REPLACE INTO important_verses (book_id, chapter, verse, text) VALUES (?, ?, ?, ?)
`);

// Mapping fra boknavn til book_id
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

    // Hent teksten mellom anførselstegn
    const textMatch = line.match(/"([^"]+)"/);
    const text = textMatch ? textMatch[1] : null;

    // Format 1: bookId:chapter:verse - "tekst"
    const numericMatch = line.match(/^(\d+):(\d+):(\d+)/);
    if (numericMatch) {
      const [, bookId, chapter, verse] = numericMatch;
      insertImportantVerse.run(parseInt(bookId), parseInt(chapter), parseInt(verse), text);
      continue;
    }

    // Format 2: BookName chapter:verse(-verse)? - "tekst"
    const nameMatch = line.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (nameMatch) {
      const [, bookName, chapter, verseStart, verseEnd] = nameMatch;
      const bookId = bookNameMap[bookName.trim()];

      if (bookId) {
        // Legg til start-verset
        insertImportantVerse.run(bookId, parseInt(chapter), parseInt(verseStart), text);

        // Hvis det er et versintervall, legg til alle vers
        if (verseEnd) {
          for (let v = parseInt(verseStart) + 1; v <= parseInt(verseEnd); v++) {
            insertImportantVerse.run(bookId, parseInt(chapter), v, text);
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
  const files = fs.readdirSync(themesPath).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const name = file.replace('.txt', '');
    const content = fs.readFileSync(path.join(themesPath, file), 'utf-8');
    insertTheme.run(name, content);
  }
}

// Opprett indekser
console.log('Oppretter indekser...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_verses_bible ON verses(bible);
  CREATE INDEX IF NOT EXISTS idx_word4word_verse ON word4word(book_id, chapter, verse, bible);
  CREATE INDEX IF NOT EXISTS idx_references_from ON references_(from_book_id, from_chapter, from_verse);
  CREATE INDEX IF NOT EXISTS idx_important_words_chapter ON important_words(book_id, chapter);
`);

db.close();

// Kopier leseplaner til data-mappen
console.log('Kopierer leseplaner...');
const readingPlansSource = path.join(GENERATE_PATH, 'reading_plans');
const readingPlansTarget = path.join(__dirname, '../data/reading_plans');

if (fs.existsSync(readingPlansSource)) {
  // Opprett målmappe hvis den ikke finnes
  if (!fs.existsSync(readingPlansTarget)) {
    fs.mkdirSync(readingPlansTarget, { recursive: true });
  }

  // Kopier alle JSON-filer
  const planFiles = fs.readdirSync(readingPlansSource).filter(f => f.endsWith('.json'));
  for (const file of planFiles) {
    const sourcePath = path.join(readingPlansSource, file);
    const targetPath = path.join(readingPlansTarget, file);
    fs.copyFileSync(sourcePath, targetPath);
  }
  console.log(`  Kopierte ${planFiles.length} leseplaner`);
}

console.log('Ferdig!');
