import { NextRequest, NextResponse } from 'next/server';
import { getReferences } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = parseInt(searchParams.get('bookId') || '');
  const chapter = parseInt(searchParams.get('chapter') || '');
  const verse = parseInt(searchParams.get('verse') || '');

  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const data = getReferences(bookId, chapter, verse);
  return NextResponse.json(data);
}
