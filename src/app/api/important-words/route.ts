import { NextRequest, NextResponse } from 'next/server';
import { getImportantWords } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = parseInt(searchParams.get('bookId') || '');
  const chapter = parseInt(searchParams.get('chapter') || '');

  if (isNaN(bookId) || isNaN(chapter)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const data = getImportantWords(bookId, chapter);
  return NextResponse.json(data);
}
