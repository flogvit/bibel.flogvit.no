import { Router, Request, Response } from 'express';
import { getAllDays, getDayById, getTodaysDays } from '../../src/lib/bible';

export const daysRouter = Router();

/**
 * GET /api/days
 * Returns all days
 */
daysRouter.get('/', (_req: Request, res: Response) => {
  try {
    const days = getAllDays();
    res.set('Cache-Control', 'no-cache');
    res.json({ days });
  } catch (error) {
    console.error('Error fetching days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/days/today
 * Returns days matching today's date
 */
daysRouter.get('/today', (_req: Request, res: Response) => {
  try {
    const days = getTodaysDays();
    res.set('Cache-Control', 'no-cache');
    res.json(days);
  } catch (error) {
    console.error('Error fetching today\'s days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/days/:id
 * Returns a specific day
 */
daysRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const day = getDayById(id);
    if (!day) {
      res.status(404).json({ error: 'Day not found' });
      return;
    }
    res.set('Cache-Control', 'no-cache');
    res.json(day);
  } catch (error) {
    console.error('Error fetching day:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
