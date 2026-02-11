import { Router, Request, Response } from 'express';
import { getAllStories, getStoryBySlug, searchStories, getStoriesByCategory } from '../../src/lib/bible';

export const storiesRouter = Router();

/**
 * GET /api/stories
 * Returns all stories, optionally filtered by category
 */
storiesRouter.get('/', (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    const stories = category
      ? getStoriesByCategory(category)
      : getAllStories();

    res.set('Cache-Control', 'no-cache');
    res.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stories/search?q=josef
 * Search stories by title, keywords and description
 */
storiesRouter.get('/search', (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.length < 2) {
    res.json({ stories: [] });
    return;
  }

  try {
    const stories = searchStories(query);

    res.set('Cache-Control', 'no-cache');
    res.json({ stories });
  } catch (error) {
    console.error('Error searching stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stories/:slug
 * Returns a specific story by slug
 */
storiesRouter.get('/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  try {
    const story = getStoryBySlug(slug);

    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    res.set('Cache-Control', 'no-cache');
    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
