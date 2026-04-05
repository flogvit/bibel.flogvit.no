import { Router, Request, Response } from 'express';
import { getAllNumberSymbolism, getNumberSymbolismByNumber } from '../../src/lib/bible';

export const numberSymbolismRouter = Router();

/**
 * GET /api/number-symbolism
 * Returns all number symbolism entries
 */
numberSymbolismRouter.get('/', (_req: Request, res: Response) => {
  try {
    const symbolisms = getAllNumberSymbolism();

    res.set('Cache-Control', 'no-cache');
    res.json({ symbolisms });
  } catch (error) {
    console.error('Error fetching number symbolism:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/number-symbolism/:number
 * Returns a specific number symbolism entry
 */
numberSymbolismRouter.get('/:number', (req: Request, res: Response) => {
  const num = parseInt(req.params.number as string, 10);

  if (isNaN(num)) {
    res.status(400).json({ error: 'Invalid number' });
    return;
  }

  try {
    const symbolism = getNumberSymbolismByNumber(num);

    if (!symbolism) {
      res.status(404).json({ error: 'Number symbolism not found' });
      return;
    }

    res.set('Cache-Control', 'no-cache');
    res.json(symbolism);
  } catch (error) {
    console.error('Error fetching number symbolism:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
