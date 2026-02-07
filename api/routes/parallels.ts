import { Router, Request, Response } from 'express';
import {
  getGospelParallelSections,
  getGospelParallels,
  getGospelParallelById,
  getGospelParallelsForChapter,
  getVerses
} from '../../src/lib/bible';

export const parallelsRouter = Router();

/**
 * GET /api/parallels
 * Returns gospel parallel sections and parallels
 */
parallelsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const sections = getGospelParallelSections();
    const parallels = getGospelParallels();

    res.set('Cache-Control', 'no-cache');
    res.json({ sections, parallels });
  } catch (error) {
    console.error('Error fetching gospel parallels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/parallels/chapter/:bookId/:chapter
 * Returns parallels for a specific chapter
 */
parallelsRouter.get('/chapter/:bookId/:chapter', (req: Request, res: Response) => {
  const bookId = parseInt(req.params.bookId as string, 10);
  const chapter = parseInt(req.params.chapter as string, 10);

  if (isNaN(bookId) || isNaN(chapter)) {
    res.status(400).json({ error: 'Invalid book ID or chapter' });
    return;
  }

  try {
    const parallels = getGospelParallelsForChapter(bookId, chapter);

    res.set('Cache-Control', 'no-cache');
    res.json({ parallels });
  } catch (error) {
    console.error('Error fetching chapter parallels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/parallels/:id
 * Returns a single gospel parallel by ID
 */
parallelsRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const parallel = getGospelParallelById(id);

    if (!parallel) {
      res.status(404).json({ error: 'Parallel not found' });
      return;
    }

    res.set('Cache-Control', 'no-cache');
    res.json(parallel);
  } catch (error) {
    console.error('Error fetching gospel parallel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/parallels/:id/verses
 * Fetches verses for a specific parallel
 * Body: { bible?: string }
 */
parallelsRouter.post('/:id/verses', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { bible = 'osnb2' } = req.body;

  try {
    const parallel = getGospelParallelById(id);

    if (!parallel) {
      res.status(404).json({ error: 'Parallel not found' });
      return;
    }

    if (!parallel.passages) {
      res.json({ verses: {} });
      return;
    }

    // Fetch verses for each passage
    const verses: Record<string, Array<{
      verse: number;
      text: string;
    }>> = {};

    for (const [gospel, passage] of Object.entries(parallel.passages)) {
      const passageVerses = getVerses(passage.book_id, passage.chapter, bible);
      // Filter to only include verses in the range
      const filteredVerses = passageVerses
        .filter(v => v.verse >= passage.verse_start && v.verse <= passage.verse_end)
        .map(v => ({
          verse: v.verse,
          text: v.text
        }));
      verses[gospel] = filteredVerses;
    }

    res.set('Cache-Control', 'no-cache');
    res.json({ verses });
  } catch (error) {
    console.error('Error fetching parallel verses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
