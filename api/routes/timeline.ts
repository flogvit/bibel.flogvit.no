import { Router, Request, Response } from 'express';
import { getTimelinePeriods, getTimelineEvents, getChapterTimelineEventIds, getMultiTimeline } from '../../src/lib/bible';

export const timelineRouter = Router();

/**
 * GET /api/timeline
 * Returns bible timeline periods and events
 * Query params: bookId, chapter (optional - filters to chapter-specific events)
 */
timelineRouter.get('/', (req: Request, res: Response) => {
  try {
    const bookId = req.query.bookId ? parseInt(req.query.bookId as string, 10) : undefined;
    const chapter = req.query.chapter ? parseInt(req.query.chapter as string, 10) : undefined;

    const periods = getTimelinePeriods();
    const events = getTimelineEvents();

    // If bookId/chapter given, also return which events are relevant for context
    const chapterEventIds = (bookId && chapter)
      ? getChapterTimelineEventIds(bookId, chapter)
      : undefined;

    res.set('Cache-Control', 'no-cache');
    res.json({ periods, events, chapterEventIds });
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

    res.set('Cache-Control', 'no-cache');
    res.json(data);
  } catch (error) {
    console.error('Error fetching multi timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
