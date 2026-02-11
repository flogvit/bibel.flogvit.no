import { Router, Request, Response } from 'express';
import {
  getVerses,
  getOriginalVerses,
  getBookSummary,
  getChapterSummary,
  getChapterContext,
  getChapterInsight,
  getOriginalWord4Word,
  getReferences,
} from '../../src/lib/bible';

export const chapterRouter = Router();

/**
 * GET /api/chapter
 * Query params: book, chapter, bible
 */
chapterRouter.get('/', (req: Request, res: Response) => {
  const bookIdStr = req.query.book as string;
  const chapterStr = req.query.chapter as string;
  const bible = (req.query.bible as string) || 'osnb2';

  // Validate required params
  if (!bookIdStr || !chapterStr) {
    res.status(400).json({ error: 'Missing required parameters: book and chapter' });
    return;
  }

  const bookId = parseInt(bookIdStr, 10);
  const chapter = parseInt(chapterStr, 10);

  // Validate numbers
  if (isNaN(bookId) || isNaN(chapter)) {
    res.status(400).json({ error: 'Invalid book or chapter number' });
    return;
  }

  // Validate book range
  if (bookId < 1 || bookId > 66) {
    res.status(400).json({ error: 'Book ID must be between 1 and 66' });
    return;
  }

  // Validate chapter
  if (chapter < 1 || chapter > 150) {
    res.status(400).json({ error: 'Invalid chapter number' });
    return;
  }

  try {
    // Get all verse data
    const verses = getVerses(bookId, chapter, bible);

    if (verses.length === 0) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    // Get original text verses
    const originalVersesRaw = getOriginalVerses(bookId, chapter);
    const originalVerses = originalVersesRaw.map(v => ({
      verse: v.verse,
      text: v.text,
    }));

    // Get secondary bible verses if requested (and different from primary)
    const secondary = req.query.secondary as string | undefined;
    let secondaryVerses: { verse: number; text: string }[] | undefined;
    if (secondary && secondary !== 'original' && secondary !== bible) {
      const secondaryRaw = getVerses(bookId, chapter, secondary);
      if (secondaryRaw.length > 0) {
        secondaryVerses = secondaryRaw.map(v => ({
          verse: v.verse,
          text: v.text,
        }));
      }
    }

    // Get word4word for each verse
    const lang = bible === 'osnn1' ? 'nn' : 'nb';
    const word4word: Record<number, unknown[]> = {};

    for (const verse of verses) {
      const w4w = getOriginalWord4Word(bookId, chapter, verse.verse, lang);
      if (w4w.length > 0) {
        word4word[verse.verse] = w4w;
      }
    }

    // Get references for each verse
    const references: Record<number, unknown[]> = {};
    for (const verse of verses) {
      const refs = getReferences(bookId, chapter, verse.verse, lang);
      if (refs.length > 0) {
        references[verse.verse] = refs;
      }
    }

    // Get chapter metadata
    const bookSummary = chapter === 1 ? getBookSummary(bookId) : null;
    const summary = getChapterSummary(bookId, chapter);
    const context = getChapterContext(bookId, chapter);
    const insight = getChapterInsight(bookId, chapter);

    const response = {
      bookId,
      chapter,
      bible,
      verses,
      originalVerses,
      ...(secondaryVerses && { secondaryVerses }),
      word4word,
      references,
      bookSummary,
      summary,
      context,
      insight,
      cachedAt: Date.now(),
    };

    // Set cache headers
    res.set('Cache-Control', 'no-cache');
    res.json(response);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
