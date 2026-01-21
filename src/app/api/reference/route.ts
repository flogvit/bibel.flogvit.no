import { NextRequest, NextResponse } from 'next/server';
import { parseReference, formatParsedReference, looksLikeReference } from '@/lib/reference-parser';
import { getVerseCount } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query || query.length < 1) {
    return NextResponse.json({
      success: false,
      error: 'Mangler søkeparameter'
    });
  }

  // Check if this looks like a Bible reference
  if (!looksLikeReference(query)) {
    return NextResponse.json({
      success: false,
      isReference: false,
      error: 'Ikke en bibelreferanse'
    });
  }

  const result = parseReference(query);

  if (result.success && result.reference) {
    // Get verse count for the chapter
    const verseCount = getVerseCount(result.reference.book.id, result.reference.chapter);

    // Validate verse numbers if provided
    if (result.reference.verseStart && result.reference.verseStart > verseCount) {
      return NextResponse.json({
        success: false,
        isReference: true,
        error: `${result.reference.book.name_no} ${result.reference.chapter} har ${verseCount} vers`,
        partial: {
          book: result.reference.book,
          chapter: result.reference.chapter,
          verseCount
        }
      });
    }

    return NextResponse.json({
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
  }

  // Partial match or suggestions
  return NextResponse.json({
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
}
