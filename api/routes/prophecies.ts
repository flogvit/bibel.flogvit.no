import { Router, Request, Response } from 'express';
import { getProphecyCategories, getProphecies } from '../../src/lib/bible';

export const propheciesRouter = Router();

/**
 * GET /api/prophecies
 * Returns prophecy categories and prophecies
 */
propheciesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const categories = getProphecyCategories();
    const prophecies = getProphecies();

    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ categories, prophecies });
  } catch (error) {
    console.error('Error fetching prophecies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
