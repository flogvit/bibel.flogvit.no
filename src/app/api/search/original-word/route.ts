import { NextRequest, NextResponse } from 'next/server';
import { searchOriginalWord } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!word) {
    return NextResponse.json({ results: [], total: 0, hasMore: false, message: 'Mangler ord-parameter' });
  }

  const response = searchOriginalWord(word, limit, offset);
  return NextResponse.json(response);
}
