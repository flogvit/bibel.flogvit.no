import { Router, Request, Response } from 'express';
import { getNumberingSystems, getChapterCountByNumbering } from '../../src/lib/bible';

export const numberingRouter = Router();

/**
 * GET /api/numbering-systems
 * Returns all available numbering systems
 */
numberingRouter.get('/', (_req: Request, res: Response) => {
  try {
    const systems = getNumberingSystems();
    res.json(systems);
  } catch (error) {
    console.error('Error fetching numbering systems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/numbering-systems/:systemId/chapters?book=1
 * Returns the number of chapters for a book in a specific numbering system
 */
numberingRouter.get('/:systemId/chapters', (req: Request, res: Response) => {
  const { systemId } = req.params;
  const bookIdStr = req.query.book as string;

  if (!bookIdStr) {
    res.status(400).json({ error: 'Missing required parameter: book' });
    return;
  }

  const bookId = parseInt(bookIdStr, 10);
  if (isNaN(bookId) || bookId < 1 || bookId > 66) {
    res.status(400).json({ error: 'Invalid book ID' });
    return;
  }

  try {
    const chapters = getChapterCountByNumbering(systemId, bookId);
    res.json({ systemId, bookId, chapters });
  } catch (error) {
    console.error('Error fetching chapter count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
