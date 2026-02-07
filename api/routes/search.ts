import { Router, Request, Response } from 'express';
import { searchVerses, searchOriginalWord } from '../../src/lib/bible';

export const searchRouter = Router();

/**
 * GET /api/search
 * Query params: q (search query), limit, offset, bible
 */
searchRouter.get('/', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);
  const bible = (req.query.bible as string) || 'osnb2';

  if (query.length < 2) {
    res.json({ results: [], total: 0, hasMore: false, message: 'Søket må være minst 2 tegn' });
    return;
  }

  try {
    const { results, total, hasMore } = searchVerses(query, limit, offset, bible);

    res.set('Cache-Control', 'no-cache');
    res.json({ results, total, hasMore });
  } catch (error) {
    console.error('Error searching verses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/search/original
 * Search in original language (Hebrew/Greek)
 * Query params: q, limit, offset
 */
searchRouter.get('/original', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  if (query.length < 1) {
    res.json({ results: [], total: 0, hasMore: false });
    return;
  }

  try {
    const result = searchOriginalWord(query, limit, offset);

    res.set('Cache-Control', 'no-cache');
    res.json(result);
  } catch (error) {
    console.error('Error searching original text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
