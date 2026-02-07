import { Router, Request, Response } from 'express';
import { getAllVerseMappings, getVerseMappingById } from '../../src/lib/bible';

export const mappingsRouter = Router();

/**
 * GET /api/mappings
 * Returns list of available verse mappings (id, name, description)
 */
mappingsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const mappings = getAllVerseMappings();
    res.set('Cache-Control', 'no-cache');
    res.json({ mappings });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/mappings/:id
 * Returns a specific mapping with full verseMap and bookNames
 */
mappingsRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const mapping = getVerseMappingById(id);

    if (!mapping) {
      res.status(404).json({ error: 'Mapping not found' });
      return;
    }

    res.set('Cache-Control', 'no-cache');
    res.json({
      id: mapping.id,
      name: mapping.name,
      description: mapping.description,
      bookNames: JSON.parse(mapping.book_names),
      verseMap: JSON.parse(mapping.verse_map),
      unmapped: mapping.unmapped ? JSON.parse(mapping.unmapped) : [],
    });
  } catch (error) {
    console.error('Error fetching mapping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
