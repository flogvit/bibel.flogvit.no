import { Router, Request, Response } from 'express';
import { getAllThemes, getThemeByName } from '../../src/lib/bible';

export const themesRouter = Router();

/**
 * GET /api/themes
 * Returns all themes
 */
themesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const themes = getAllThemes();

    res.set('Cache-Control', 'no-cache');
    res.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/themes/:id
 * Returns a specific theme
 */
themesRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const theme = getThemeByName(id);

    if (!theme) {
      res.status(404).json({ error: 'Theme not found' });
      return;
    }

    res.set('Cache-Control', 'no-cache');
    res.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
