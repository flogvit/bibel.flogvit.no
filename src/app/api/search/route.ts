import { NextRequest, NextResponse } from 'next/server';
import { searchVerses } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const bible = searchParams.get('bible') || 'osnb1';

  if (query.length < 2) {
    return NextResponse.json({ results: [], total: 0, hasMore: false, message: 'Søket må være minst 2 tegn' });
  }

  const { results, total, hasMore } = searchVerses(query, limit, offset, bible);
  return NextResponse.json({ results, total, hasMore });
}
