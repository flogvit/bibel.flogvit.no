import { NextRequest, NextResponse } from 'next/server';
import { parseReference, formatParsedReference } from '@/lib/reference-parser';
import { getDb } from '@/lib/db';

interface VerseResult {
  refString: string;
  text: string;
  url: string;
  formattedRef: string;
}

/**
 * POST /api/verse-refs
 * Takes an array of reference strings (e.g., ["matt 6,9", "joh 3,16"])
 * Returns the verse text for each reference
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refs: string[] = body.refs;
    const bible = body.bible || 'osnb2';

    if (!refs || !Array.isArray(refs)) {
      return NextResponse.json({ error: 'Missing refs array' }, { status: 400 });
    }

    const db = getDb();
    const results: Record<string, VerseResult> = {};

    for (const refString of refs) {
      const parsed = parseReference(refString);

      if (!parsed.success || !parsed.reference) {
        continue;
      }

      const ref = parsed.reference;
      const start = ref.verseStart || 1;
      const end = ref.verseEnd || ref.verseStart || 1;

      // Fetch verses from database
      const verses = db.prepare(`
        SELECT verse, text FROM verses
        WHERE book_id = ? AND chapter = ? AND verse >= ? AND verse <= ? AND bible = ?
        ORDER BY verse
      `).all(ref.book.id, ref.chapter, start, end, bible) as { verse: number; text: string }[];

      if (verses.length > 0) {
        results[refString] = {
          refString,
          text: verses.map(v => v.text).join(' '),
          url: ref.url,
          formattedRef: formatParsedReference(ref),
        };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching verse refs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
