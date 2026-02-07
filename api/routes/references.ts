import { Router, Request, Response } from 'express';
import { getReferences } from '../../src/lib/bible';

export const referencesRouter = Router();

/**
 * GET /api/references
 * Query params: bookId, chapter, verse
 */
referencesRouter.get('/', (req: Request, res: Response) => {
  const bookId = parseInt(req.query.bookId as string);
  const chapter = parseInt(req.query.chapter as string);
  const verse = parseInt(req.query.verse as string);

  const lang = (req.query.lang as string) || 'nb';

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const data = getReferences(bookId, chapter, verse, lang);
  res.json(data);
});
