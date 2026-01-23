import { NextRequest, NextResponse } from 'next/server';
import { getFullProphecyData, getPropheciesByCategory, getProphecyById, getPropheciesForChapter, getPropheciesForVerse } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  const prophecyId = searchParams.get('id');
  const bookId = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');

  // Get single prophecy by ID
  if (prophecyId) {
    const prophecy = getProphecyById(prophecyId);
    if (!prophecy) {
      return NextResponse.json({ error: 'Prophecy not found' }, { status: 404 });
    }
    return NextResponse.json(prophecy);
  }

  // Get prophecies for a specific verse
  if (bookId && chapter && verse) {
    const prophecies = getPropheciesForVerse(parseInt(bookId), parseInt(chapter), parseInt(verse));
    return NextResponse.json({ prophecies });
  }

  // Get prophecies for a specific chapter
  if (bookId && chapter) {
    const prophecies = getPropheciesForChapter(parseInt(bookId), parseInt(chapter));
    return NextResponse.json({ prophecies });
  }

  // Get prophecies by category
  if (categoryId) {
    const prophecies = getPropheciesByCategory(categoryId);
    return NextResponse.json({ prophecies });
  }

  // Get all prophecy data
  const data = getFullProphecyData();
  return NextResponse.json(data);
}
