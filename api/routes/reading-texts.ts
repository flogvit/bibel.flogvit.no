import { Router, Request, Response } from 'express';
import {
  getAllReadingTexts,
  getReadingTextById,
  getTodaysReadingTexts,
  getVerse,
} from '../../src/lib/bible';
import type { ReadingTextWithRefs, ReadingTextRef } from '../../src/lib/bible';
import { UkvnMapper, loadUkvnMapping, ukvnEncode, ukvnDecode, sliceVersePart, resolveMappingId } from '@free-bible/kvn';

export const readingTextsRouter = Router();

// Cache mappers
const mapperCache = new Map<string, UkvnMapper>();
function getCachedMapper(mappingId: string): UkvnMapper {
  if (!mapperCache.has(mappingId)) {
    mapperCache.set(mappingId, new UkvnMapper(loadUkvnMapping(mappingId)));
  }
  return mapperCache.get(mappingId)!;
}

/** Convert osmain coordinates to a target mapping's coordinates */
function osmainTo(bookId: number, chapter: number, verse: number, mappingId: string): { chapter: number; verse: number } {
  const mapper = getCachedMapper(mappingId);
  const osmainKvn = ukvnEncode(bookId, chapter, verse);
  const tkvn = mapper.toTkvn(osmainKvn);
  const decoded = ukvnDecode(tkvn);
  return { chapter: decoded.chapter, verse: decoded.verse };
}

interface EnrichedVerse {
  chapter: number;  // in display mapping
  verse: number;    // in display mapping
  text: string;
  part?: string;    // 'a', 'b' etc. if sub-verse
}

/**
 * Enrich a reading text with verse texts.
 * - bible: which bible text to fetch (osnb2, osnn1, etc.)
 * - mapping: which numbering system to use for display verse numbers
 */
function enrichWithVerseText(
  text: ReadingTextWithRefs,
  bible: string,
  mapping: string,
): ReadingTextWithRefs & { verses: Record<string, EnrichedVerse[]> } {
  const verses: Record<string, EnrichedVerse[]> = {};
  // Resolve mapping to canonical ID, fall back to osnb2
  const resolvedMapping = resolveMappingId(mapping) || 'osnb2';

  for (const ref of text.readings) {
    const key = ref.display_ref;
    if (verses[key]) continue;

    const refVerses: EnrichedVerse[] = [];
    const relatedRefs = text.readings.filter(r => r.display_ref === key);

    for (const r of relatedRefs) {
      const end = r.verse_end ?? r.verse_start;
      for (let v = r.verse_start; v <= end; v++) {
        // osmain → osnb2 for fetching text
        const osnb2 = osmainTo(r.book_id, r.chapter, v, 'osnb2');
        const verse = getVerse(r.book_id, osnb2.chapter, osnb2.verse, bible);
        if (!verse) continue;

        let verseText = verse.text;
        let part: string | undefined;

        // Handle sub-verse parts
        const isFirstVerse = v === r.verse_start;
        const isLastVerse = v === end;
        if (isFirstVerse && r.part_start) {
          const partNum = r.part_start.charCodeAt(0) - 96;
          verseText = sliceVersePart(verseText, partNum, partNum + 1);
          part = r.part_start;
        } else if (isLastVerse && r.part_end && r.part_end !== r.part_start) {
          const partNum = r.part_end.charCodeAt(0) - 96;
          verseText = sliceVersePart(verseText, partNum, partNum + 1);
          part = r.part_end;
        }

        if (!verseText.trim()) continue;

        // osmain → display mapping for verse numbers
        const display = osmainTo(r.book_id, r.chapter, v, resolvedMapping);

        refVerses.push({
          chapter: display.chapter,
          verse: display.verse,
          text: verseText,
          ...(part && { part }),
        });
      }
    }

    verses[key] = refVerses;
  }

  return { ...text, verses };
}

/**
 * GET /api/reading-texts
 * Returns all reading texts
 */
readingTextsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const texts = getAllReadingTexts();
    res.set('Cache-Control', 'no-cache');
    res.json({ readingTexts: texts });
  } catch (error) {
    console.error('Error fetching reading texts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reading-texts/today
 * Returns reading texts matching today's date
 */
readingTextsRouter.get('/today', (_req: Request, res: Response) => {
  try {
    const texts = getTodaysReadingTexts();
    res.set('Cache-Control', 'no-cache');
    res.json(texts);
  } catch (error) {
    console.error('Error fetching today\'s reading texts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reading-texts/:id
 * Returns a specific reading text with its references
 */
readingTextsRouter.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const bible = (req.query.bible as string) || 'osnb2';
  const mapping = (req.query.mapping as string) || 'osnb2';

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const text = getReadingTextById(id);
    if (!text) {
      res.status(404).json({ error: 'Reading text not found' });
      return;
    }
    const enriched = enrichWithVerseText(text, bible, mapping);
    res.set('Cache-Control', 'no-cache');
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching reading text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
