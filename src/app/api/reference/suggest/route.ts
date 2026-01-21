import { NextRequest, NextResponse } from 'next/server';
import { getBookSuggestions, findBook } from '@/lib/reference-parser';
import { getVerseCount, getAllBooks } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const bookId = searchParams.get('book');
  const chapter = searchParams.get('chapter');

  // If book and chapter provided, return verse count
  if (bookId && chapter) {
    const verseCount = getVerseCount(parseInt(bookId, 10), parseInt(chapter, 10));
    return NextResponse.json({
      verseCount
    });
  }

  // If no query, return all books
  if (!query) {
    const books = getAllBooks();
    return NextResponse.json({
      suggestions: books.map(book => ({
        book,
        matchedAlias: book.short_name
      }))
    });
  }

  // Get book suggestions based on query
  const suggestions = getBookSuggestions(query);

  // Also check for exact book match and include chapter info
  const exactBook = findBook(query);
  if (exactBook) {
    return NextResponse.json({
      suggestions: suggestions.length > 0 ? suggestions : [{ book: exactBook, matchedAlias: query }],
      selectedBook: exactBook
    });
  }

  return NextResponse.json({
    suggestions
  });
}
