import { Router, Request, Response } from 'express';
import { parseReference, formatParsedReference, looksLikeReference, getBookSuggestions, findBook } from '../../src/lib/reference-parser';
import { getVerseCount, getAllBooks } from '../../src/lib/bible';

export const referenceRouter = Router();

/**
 * GET /api/reference
 * Parse a Bible reference query
 * Query params: q
 */
referenceRouter.get('/', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';

  if (!query || query.length < 1) {
    res.json({
      success: false,
      error: 'Mangler søkeparameter'
    });
    return;
  }

  // Check if this looks like a Bible reference
  if (!looksLikeReference(query)) {
    res.json({
      success: false,
      isReference: false,
      error: 'Ikke en bibelreferanse'
    });
    return;
  }

  const result = parseReference(query);

  if (result.success && result.reference) {
    // Get verse count for the chapter
    const verseCount = getVerseCount(result.reference.book.id, result.reference.chapter);

    // Validate verse numbers if provided
    if (result.reference.verseStart && result.reference.verseStart > verseCount) {
      res.json({
        success: false,
        isReference: true,
        error: `${result.reference.book.name_no} ${result.reference.chapter} har ${verseCount} vers`,
        partial: {
          book: result.reference.book,
          chapter: result.reference.chapter,
          verseCount
        }
      });
      return;
    }

    res.json({
      success: true,
      isReference: true,
      reference: {
        book: result.reference.book,
        chapter: result.reference.chapter,
        verseStart: result.reference.verseStart,
        verseEnd: result.reference.verseEnd,
        url: result.reference.url,
        formatted: formatParsedReference(result.reference),
        verseCount
      }
    });
    return;
  }

  // Partial match or suggestions
  res.json({
    success: false,
    isReference: true,
    error: result.error,
    suggestions: result.suggestions?.map(s => ({
      book: s.book,
      matchedAlias: s.matchedAlias
    })),
    partial: result.partial ? {
      book: result.partial.book,
      chapter: result.partial.chapter
    } : undefined
  });
});

/**
 * GET /api/reference/suggest
 * Get book suggestions for autocomplete
 * Query params: q, book, chapter
 */
referenceRouter.get('/suggest', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const bookId = req.query.book as string;
  const chapter = req.query.chapter as string;

  // If book and chapter provided, return verse count
  if (bookId && chapter) {
    const verseCount = getVerseCount(parseInt(bookId, 10), parseInt(chapter, 10));
    res.json({ verseCount });
    return;
  }

  // If no query, return all books
  if (!query) {
    const books = getAllBooks();
    res.json({
      suggestions: books.map(book => ({
        book,
        matchedAlias: book.short_name
      }))
    });
    return;
  }

  // Get book suggestions based on query
  const suggestions = getBookSuggestions(query);

  // Also check for exact book match and include chapter info
  const exactBook = findBook(query);
  if (exactBook) {
    res.json({
      suggestions: suggestions.length > 0 ? suggestions : [{ book: exactBook, matchedAlias: query }],
      selectedBook: exactBook
    });
    return;
  }

  res.json({ suggestions });
});
