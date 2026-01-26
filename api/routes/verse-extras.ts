import { Router, Request, Response } from 'express';
import { getVersePrayer, getVerseSermon } from '../../src/lib/bible';

export const verseExtrasRouter = Router();

/**
 * GET /api/verse-extras
 * Query params: bookId, chapter, verse
 */
verseExtrasRouter.get('/', (req: Request, res: Response) => {
  const bookId = parseInt(req.query.bookId as string);
  const chapter = parseInt(req.query.chapter as string);
  const verse = parseInt(req.query.verse as string);

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const prayer = getVersePrayer(bookId, chapter, verse);
  const sermon = getVerseSermon(bookId, chapter, verse);

  res.json({ prayer, sermon });
});
