import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface FavoriteInput {
  bookId: number;
  chapter: number;
  verse: number;
}

export async function POST(request: Request) {
  try {
    const { favorites } = await request.json() as { favorites: FavoriteInput[] };

    if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
      return NextResponse.json([]);
    }

    const db = getDb();

    const results = favorites.map(fav => {
      const verse = db.prepare(`
        SELECT v.text, b.name_no as book_name, b.short_name as book_short_name
        FROM verses v
        JOIN books b ON v.book_id = b.id
        WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ? AND v.bible = 'osnb2'
      `).get(fav.bookId, fav.chapter, fav.verse) as { text: string; book_name: string; book_short_name: string } | undefined;

      if (!verse) return null;

      return {
        bookId: fav.bookId,
        chapter: fav.chapter,
        verse: fav.verse,
        bookName: verse.book_name,
        bookShortName: verse.book_short_name,
        text: verse.text,
      };
    }).filter(Boolean);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to get favorite verses:', error);
    return NextResponse.json({ error: 'Failed to get verses' }, { status: 500 });
  }
}
