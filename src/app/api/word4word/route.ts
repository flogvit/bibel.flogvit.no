import { NextRequest, NextResponse } from 'next/server';
import { getWord4Word, getOriginalWord4Word } from '@/lib/bible';

// Map bible codes to language codes
function getBibleLanguage(bible: string): string {
  if (bible.includes('nn') || bible === 'osnn1') return 'nn';
  return 'nb'; // Default to bokmål
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = parseInt(searchParams.get('bookId') || '');
  const chapter = parseInt(searchParams.get('chapter') || '');
  const verse = parseInt(searchParams.get('verse') || '');
  const bible = searchParams.get('bible') || 'osnb2';
  const langParam = searchParams.get('lang');

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // If bible is 'original', get the appropriate original text (tanach/sblgnt)
  // with language based on explicit lang param or current bible being read
  const lang = langParam || getBibleLanguage(bible);
  const data = bible === 'original'
    ? getOriginalWord4Word(bookId, chapter, verse, lang)
    : getWord4Word(bookId, chapter, verse, bible);

  return NextResponse.json(data);
}
