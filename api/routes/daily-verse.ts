import { Router, Request, Response } from 'express';
import { getDb } from '../../src/lib/db';

export const dailyVerseRouter = Router();

interface DailyVerseRow {
  date: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  note: string | null;
}

interface BookRow {
  id: number;
  name_no: string;
  short_name: string;
}

interface VerseRow {
  verse: number;
  text: string;
}

/**
 * GET /api/daily-verse
 * Returns today's verse with full text
 */
dailyVerseRouter.get('/', (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const db = getDb();

    const dailyVerse = db.prepare(`
      SELECT date, book_id, chapter, verse_start, verse_end, note
      FROM daily_verses WHERE date = ?
    `).get(dateStr) as DailyVerseRow | undefined;

    if (!dailyVerse) {
      res.status(404).json({ error: 'No verse for today' });
      return;
    }

    const book = db.prepare(`
      SELECT id, name_no, short_name FROM books WHERE id = ?
    `).get(dailyVerse.book_id) as BookRow | undefined;

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const verses = db.prepare(`
      SELECT verse, text FROM verses
      WHERE book_id = ? AND chapter = ? AND verse >= ? AND verse <= ? AND bible = 'osnb2'
      ORDER BY verse
    `).all(dailyVerse.book_id, dailyVerse.chapter, dailyVerse.verse_start, dailyVerse.verse_end) as VerseRow[];

    const verseText = verses.map(v => v.text).join(' ');

    const verseDisplay = dailyVerse.verse_start === dailyVerse.verse_end
      ? `${dailyVerse.verse_start}`
      : `${dailyVerse.verse_start}-${dailyVerse.verse_end}`;

    res.set('Cache-Control', 'no-cache');
    res.json({
      date: dateStr,
      reference: {
        bookId: dailyVerse.book_id,
        bookName: book.name_no,
        shortName: book.short_name,
        chapter: dailyVerse.chapter,
        verseStart: dailyVerse.verse_start,
        verseEnd: dailyVerse.verse_end,
        display: `${book.name_no} ${dailyVerse.chapter}:${verseDisplay}`,
      },
      text: verseText,
      note: dailyVerse.note,
    });
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/daily-verse/:date
 * Returns the verse for a specific date (format: YYYY-MM-DD)
 */
dailyVerseRouter.get('/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date as string;
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateMatch) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const db = getDb();

    const dailyVerse = db.prepare(`
      SELECT date, book_id, chapter, verse_start, verse_end, note
      FROM daily_verses WHERE date = ?
    `).get(date) as DailyVerseRow | undefined;

    if (!dailyVerse) {
      res.status(404).json({ error: 'No verse for this date' });
      return;
    }

    const book = db.prepare(`
      SELECT id, name_no, short_name FROM books WHERE id = ?
    `).get(dailyVerse.book_id) as BookRow | undefined;

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const verses = db.prepare(`
      SELECT verse, text FROM verses
      WHERE book_id = ? AND chapter = ? AND verse >= ? AND verse <= ? AND bible = 'osnb2'
      ORDER BY verse
    `).all(dailyVerse.book_id, dailyVerse.chapter, dailyVerse.verse_start, dailyVerse.verse_end) as VerseRow[];

    const verseText = verses.map(v => v.text).join(' ');

    const verseDisplay = dailyVerse.verse_start === dailyVerse.verse_end
      ? `${dailyVerse.verse_start}`
      : `${dailyVerse.verse_start}-${dailyVerse.verse_end}`;

    res.set('Cache-Control', 'no-cache');
    res.json({
      date,
      reference: {
        bookId: dailyVerse.book_id,
        bookName: book.name_no,
        shortName: book.short_name,
        chapter: dailyVerse.chapter,
        verseStart: dailyVerse.verse_start,
        verseEnd: dailyVerse.verse_end,
        display: `${book.name_no} ${dailyVerse.chapter}:${verseDisplay}`,
      },
      text: verseText,
      note: dailyVerse.note,
    });
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
