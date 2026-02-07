import { Router, Request, Response } from 'express';
import { getAllBooks, getBookSummary } from '../../src/lib/bible';

export const booksRouter = Router();

/**
 * GET /api/books
 * Returns all books with their metadata
 */
booksRouter.get('/', (_req: Request, res: Response) => {
  try {
    const books = getAllBooks();

    // Add summaries to books
    const booksWithSummaries = books.map(book => ({
      ...book,
      summary: getBookSummary(book.id),
    }));

    res.set('Cache-Control', 'no-cache');
    res.json({ books: booksWithSummaries });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
