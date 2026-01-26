import Database from 'better-sqlite3';
import path from 'path';

const bibleDbPath = path.join(process.cwd(), 'data', 'bible.db');
const usersDbPath = path.join(process.cwd(), 'data', 'users.db');

let bibleDb: Database.Database | null = null;
let usersDb: Database.Database | null = null;

// Bibeldatabase (read-only i produksjon)
export function getDb(): Database.Database {
  if (!bibleDb) {
    bibleDb = new Database(bibleDbPath, { readonly: true });
  }
  return bibleDb;
}

// Brukerdatabase (read-write)
export function getUsersDb(): Database.Database {
  if (!usersDb) {
    usersDb = new Database(usersDbPath);
    usersDb.pragma('journal_mode = WAL');
    initUsersDb(usersDb);
  }
  return usersDb;
}

function initUsersDb(db: Database.Database): void {
  db.exec(`
    -- Brukere
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Brukerinnstillinger
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      font_size TEXT DEFAULT 'medium',
      show_word4word INTEGER DEFAULT 0,
      show_references INTEGER DEFAULT 1,
      preferred_bible TEXT DEFAULT 'osnb2',
      dark_mode INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Bokmerker
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Lesehistorikk
    CREATE TABLE IF NOT EXISTS reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Sam-lesing sesjoner
    CREATE TABLE IF NOT EXISTS live_sessions (
      id TEXT PRIMARY KEY,
      host_user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (host_user_id) REFERENCES users(id)
    );
  `);
}

export function closeDb(): void {
  if (bibleDb) {
    bibleDb.close();
    bibleDb = null;
  }
  if (usersDb) {
    usersDb.close();
    usersDb = null;
  }
}
