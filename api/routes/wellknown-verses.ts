import { Router, Request, Response } from 'express';
import { getAllWellKnownVerses } from '../../src/lib/bible';

export const wellknownVersesRouter = Router();

/**
 * GET /api/wellknown-verses
 * Get all well-known (famous) Bible verses
 */
wellknownVersesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const verses = getAllWellKnownVerses();
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(verses);
  } catch (error) {
    console.error('Failed to get well-known verses:', error);
    res.status(500).json({ error: 'Failed to get well-known verses' });
  }
});
