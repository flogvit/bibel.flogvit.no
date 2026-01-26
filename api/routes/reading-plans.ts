import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const readingPlansRouter = Router();

const READING_PLANS_PATH = path.join(__dirname, '..', '..', 'data', 'reading_plans');

/**
 * GET /api/reading-plans
 * Returns all reading plans
 */
readingPlansRouter.get('/', (_req: Request, res: Response) => {
  try {
    const indexPath = path.join(READING_PLANS_PATH, 'index.json');
    const data = fs.readFileSync(indexPath, 'utf-8');
    const plans = JSON.parse(data);

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(plans);
  } catch (error) {
    console.error('Error fetching reading plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reading-plans/:id
 * Returns a specific reading plan
 */
readingPlansRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const planPath = path.join(READING_PLANS_PATH, `${id}.json`);

    if (!fs.existsSync(planPath)) {
      res.status(404).json({ error: 'Reading plan not found' });
      return;
    }

    const data = fs.readFileSync(planPath, 'utf-8');
    const plan = JSON.parse(data);

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(plan);
  } catch (error) {
    console.error('Error fetching reading plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
