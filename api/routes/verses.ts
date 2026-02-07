import { Router, Request, Response } from 'express';
import { getVersesWithOriginal, type VerseRef } from '../../src/lib/bible';

export const versesRouter = Router();

/**
 * POST /api/verses
 * Body: { refs: VerseRef[], bible?: string }
 */
versesRouter.post('/', (req: Request, res: Response) => {
  const { refs, bible = 'osnb2' } = req.body;

  if (!refs || !Array.isArray(refs)) {
    res.status(400).json({ error: 'Missing refs array' });
    return;
  }

  try {
    const verses = getVersesWithOriginal(refs as VerseRef[], bible);

    res.set('Cache-Control', 'no-cache');
    res.json(verses);
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
