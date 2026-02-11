import { Router, Request, Response } from 'express';
import { getVersesWithOriginal, type VerseRef } from '../../src/lib/bible';
import { parseStandardRef, refSegmentsToVerseRefs } from '../../src/lib/standard-ref-parser';

export const versesRouter = Router();

/**
 * GET /api/verses?ref=Joh+3,16-19&bible=osnb2
 * Parse standard Norwegian reference and return verses
 */
versesRouter.get('/', (req: Request, res: Response) => {
  const ref = req.query.ref as string;
  const bible = (req.query.bible as string) || 'osnb2';

  if (!ref) {
    res.status(400).json({ error: 'Missing ref parameter' });
    return;
  }

  try {
    const segments = parseStandardRef(ref);
    if (segments.length === 0) {
      res.status(400).json({ error: 'Invalid reference' });
      return;
    }

    const verseRefs = refSegmentsToVerseRefs(segments);
    const verses = getVersesWithOriginal(verseRefs as VerseRef[], bible);

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(verses);
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
