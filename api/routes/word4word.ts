import { Router, Request, Response } from 'express';
import { getWord4Word, getOriginalWord4Word } from '../../src/lib/bible';

export const word4wordRouter = Router();

// Map bible codes to language codes
function getBibleLanguage(bible: string): string {
  if (bible.includes('nn') || bible === 'osnn1') return 'nn';
  return 'nb'; // Default to bokmål
}

/**
 * GET /api/word4word
 * Query params: bookId, chapter, verse, bible, lang
 */
word4wordRouter.get('/', (req: Request, res: Response) => {
  const bookId = parseInt(req.query.bookId as string);
  const chapter = parseInt(req.query.chapter as string);
  const verse = parseInt(req.query.verse as string);
  const bible = (req.query.bible as string) || 'osnb2';
  const langParam = req.query.lang as string | undefined;

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  // If bible is 'original', get the appropriate original text (tanach/sblgnt)
  // with language based on explicit lang param or current bible being read
  const lang = langParam || getBibleLanguage(bible);
  const data = bible === 'original'
    ? getOriginalWord4Word(bookId, chapter, verse, lang)
    : getWord4Word(bookId, chapter, verse, bible);

  res.json(data);
});
