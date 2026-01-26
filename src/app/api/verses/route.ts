import { NextRequest, NextResponse } from 'next/server';
import { getVersesWithOriginal, type VerseRef } from '@/lib/bible';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refs: VerseRef[] = body.refs;
    const bible = body.bible || 'osnb2';

    if (!refs || !Array.isArray(refs)) {
      return NextResponse.json({ error: 'Missing refs array' }, { status: 400 });
    }

    const verses = getVersesWithOriginal(refs, bible);
    return NextResponse.json(verses);
  } catch (error) {
    console.error('Error fetching verses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
