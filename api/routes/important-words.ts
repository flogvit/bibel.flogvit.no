import { Router, Request, Response } from 'express';
import { getImportantWords } from '../../src/lib/bible';

export const importantWordsRouter = Router();

/**
 * GET /api/important-words?bookId=1&chapter=1
 * Returns important words for a specific chapter
 */
importantWordsRouter.get('/', (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.query.bookId as string);
    const chapter = parseInt(req.query.chapter as string);

    if (isNaN(bookId) || isNaN(chapter)) {
      res.status(400).json({ error: 'Missing or invalid bookId/chapter parameters' });
      return;
    }

    const words = getImportantWords(bookId, chapter);

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(words);
  } catch (error) {
    console.error('Error fetching important words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
