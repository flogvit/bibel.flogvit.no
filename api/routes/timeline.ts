import { Router, Request, Response } from 'express';
import { getTimelinePeriods, getTimelineEvents, getMultiTimeline } from '../../src/lib/bible';

export const timelineRouter = Router();

/**
 * GET /api/timeline
 * Returns bible timeline periods and events (backward compatible)
 */
timelineRouter.get('/', (_req: Request, res: Response) => {
  try {
    const periods = getTimelinePeriods();
    const events = getTimelineEvents();

    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ periods, events });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/timeline/multi
 * Returns all three timeline types (bible, world, books)
 */
timelineRouter.get('/multi', (_req: Request, res: Response) => {
  try {
    const data = getMultiTimeline();

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(data);
  } catch (error) {
    console.error('Error fetching multi timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
