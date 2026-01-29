import { Router, Request, Response } from 'express';
import { getDb } from '../../src/lib/db';

export const readingPlansRouter = Router();

interface ReadingPlanRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  days: number;
  content: string;
}

/**
 * GET /api/reading-plans
 * Returns all reading plans (without readings data)
 */
readingPlansRouter.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDb();

    const plans = db.prepare(`
      SELECT id, name, description, category, days FROM reading_plans ORDER BY days
    `).all() as Omit<ReadingPlanRow, 'content'>[];

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(plans);
  } catch (error) {
    console.error('Error fetching reading plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reading-plans/:id
 * Returns a specific reading plan with full readings data
 */
readingPlansRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const db = getDb();

    const plan = db.prepare(`
      SELECT id, name, description, category, days, content FROM reading_plans WHERE id = ?
    `).get(id) as ReadingPlanRow | undefined;

    if (!plan) {
      res.status(404).json({ error: 'Reading plan not found' });
      return;
    }

    // Return the full plan content (which includes readings)
    const fullPlan = JSON.parse(plan.content);

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(fullPlan);
  } catch (error) {
    console.error('Error fetching reading plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
