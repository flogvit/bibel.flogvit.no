import { Router, Request, Response } from 'express';
import { getBibleStatistics, getTopWords, getTopOriginalWords } from '../../src/lib/bible';

export const statisticsRouter = Router();

/**
 * GET /api/statistics
 * Returns overall Bible statistics
 */
statisticsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const stats = getBibleStatistics();
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/statistics/top-words
 * Returns most frequent words in Norwegian
 * Query params:
 *   - limit: max number of words (default 100, max 500)
 *   - all: include stop words (default false)
 */
statisticsRouter.get('/top-words', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const includeStopWords = req.query.all === 'true';
    const words = getTopWords('osnb2', limit, includeStopWords);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ words });
  } catch (error) {
    console.error('Error fetching top words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/statistics/top-words/hebrew
 * Returns most frequent Hebrew words
 */
statisticsRouter.get('/top-words/hebrew', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const words = getTopOriginalWords('hebrew', limit);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ words, language: 'hebrew' });
  } catch (error) {
    console.error('Error fetching Hebrew top words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/statistics/top-words/greek
 * Returns most frequent Greek words
 */
statisticsRouter.get('/top-words/greek', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const words = getTopOriginalWords('greek', limit);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ words, language: 'greek' });
  } catch (error) {
    console.error('Error fetching Greek top words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
