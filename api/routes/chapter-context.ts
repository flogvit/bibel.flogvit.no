import { Router, Request, Response } from 'express';
import {
  getChapterSummary,
  getChapterContext,
  getBookById,
  getBookSummary,
  getTimelineEventsForChapter,
} from '../../src/lib/bible';

export const chapterContextRouter = Router();

interface ChapterRequest {
  bookId: number;
  chapter: number;
}

/**
 * POST /api/chapter-context
 * Batch endpoint for chapter summaries, context, book summaries, and timeline events.
 * Body: { chapters: [{ bookId, chapter }, ...] } (max 20)
 */
chapterContextRouter.post('/', (req: Request, res: Response) => {
  const { chapters } = req.body;

  if (!Array.isArray(chapters) || chapters.length === 0) {
    res.status(400).json({ error: 'Missing or empty chapters array' });
    return;
  }

  if (chapters.length > 20) {
    res.status(400).json({ error: 'Maximum 20 chapters per request' });
    return;
  }

  try {
    // Track which books we've already fetched summaries for
    const bookSummaries = new Map<number, string | null>();

    const results = chapters.map((ch: ChapterRequest) => {
      const bookId = Number(ch.bookId);
      const chapter = Number(ch.chapter);

      if (isNaN(bookId) || isNaN(chapter) || bookId < 1 || bookId > 66 || chapter < 1) {
        return { bookId, chapter, error: 'Invalid bookId or chapter' };
      }

      const book = getBookById(bookId);
      const summary = getChapterSummary(bookId, chapter);
      const context = getChapterContext(bookId, chapter);

      // Get book summary (cached per book)
      if (!bookSummaries.has(bookId)) {
        bookSummaries.set(bookId, getBookSummary(bookId));
      }

      // Get timeline events for this chapter
      const timelineEvents = getTimelineEventsForChapter(bookId, chapter).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        year_display: e.year_display,
        period_name: e.period?.name ?? null,
        period_color: e.period?.color ?? null,
      }));

      return {
        bookId,
        chapter,
        bookName: book?.name_no ?? null,
        bookShortName: book?.short_name ?? null,
        bookSummary: bookSummaries.get(bookId) ?? null,
        summary,
        context,
        timelineEvents,
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching chapter context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
