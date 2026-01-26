import { Router, Request, Response } from 'express';
import { getDb } from '../../src/lib/db';

export const favoritesRouter = Router();

interface FavoriteInput {
  bookId: number;
  chapter: number;
  verse: number;
}

/**
 * POST /api/favorites
 * Get verse texts for favorites
 */
favoritesRouter.post('/', (req: Request, res: Response) => {
  try {
    const { favorites } = req.body as { favorites: FavoriteInput[] };

    if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
      res.json([]);
      return;
    }

    const db = getDb();

    const results = favorites.map(fav => {
      const verse = db.prepare(`
        SELECT v.text, b.name_no as book_name, b.short_name as book_short_name
        FROM verses v
        JOIN books b ON v.book_id = b.id
        WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ? AND v.bible = 'osnb2'
      `).get(fav.bookId, fav.chapter, fav.verse) as { text: string; book_name: string; book_short_name: string } | undefined;

      if (!verse) return null;

      return {
        bookId: fav.bookId,
        chapter: fav.chapter,
        verse: fav.verse,
        bookName: verse.book_name,
        bookShortName: verse.book_short_name,
        text: verse.text,
      };
    }).filter(Boolean);

    res.json(results);
  } catch (error) {
    console.error('Failed to get favorite verses:', error);
    res.status(500).json({ error: 'Failed to get verses' });
  }
});
