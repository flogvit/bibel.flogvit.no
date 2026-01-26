import { Router, Request, Response } from 'express';
import { getTimelinePeriods, getTimelineEvents } from '../../src/lib/bible';

export const timelineRouter = Router();

/**
 * GET /api/timeline
 * Returns timeline periods and events
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
