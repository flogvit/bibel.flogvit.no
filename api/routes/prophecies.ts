import { Router, Request, Response } from 'express';
import { getProphecyCategories, getProphecies, getPropheciesForVerse } from '../../src/lib/bible';

export const propheciesRouter = Router();

/**
 * GET /api/prophecies
 * Returns prophecy categories and prophecies
 * Optional query params: book, chapter, verse - filters to prophecies for that verse
 */
propheciesRouter.get('/', (req: Request, res: Response) => {
  try {
    const { book, chapter, verse } = req.query;

    if (book && chapter && verse) {
      const prophecies = getPropheciesForVerse(Number(book), Number(chapter), Number(verse));
      res.set('Cache-Control', 'no-cache');
      res.json({ prophecies });
      return;
    }

    const categories = getProphecyCategories();
    const prophecies = getProphecies();

    res.set('Cache-Control', 'no-cache');
    res.json({ categories, prophecies });
  } catch (error) {
    console.error('Error fetching prophecies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
