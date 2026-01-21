import { NextRequest, NextResponse } from 'next/server';
import { getWord4Word, getOriginalWord4Word } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = parseInt(searchParams.get('bookId') || '');
  const chapter = parseInt(searchParams.get('chapter') || '');
  const verse = parseInt(searchParams.get('verse') || '');
  const bible = searchParams.get('bible') || 'osnb1';

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // If bible is 'original', get the appropriate original text (tanach/sblgnt)
  const data = bible === 'original'
    ? getOriginalWord4Word(bookId, chapter, verse)
    : getWord4Word(bookId, chapter, verse, bible);

  return NextResponse.json(data);
}
