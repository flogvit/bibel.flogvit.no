import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { getBookSuggestions } from '@/lib/devotional-utils';
import { findBookClient } from '@/lib/standard-ref-parser';
import { getChapterVerseCount } from '@/lib/verse-counts';
import { booksData } from '@/lib/books-data';

export function verseAutocomplete(context: CompletionContext): CompletionResult | null {
  // Get text before cursor and check for [ref: or [vers: pattern
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.substring(0, context.pos - line.from);

  const match = textBefore.match(/\[(ref|vers):([^\]]*)$/);
  if (!match) return null;

  const refType = match[1];
  const query = match[2];
  const refStart = context.pos - query.length;

  if (refType === 'ref' && query.trim()) {
    const trimmed = query.trim();
    const hasTrailingSpace = query.endsWith(' ') || query.endsWith('\t');
    const spaceDigitIdx = trimmed.search(/\s+\d/);

    let bookPart: string | null = null;
    let rest = '';
    if (spaceDigitIdx > 0) {
      bookPart = trimmed.substring(0, spaceDigitIdx).trim();
      rest = trimmed.substring(spaceDigitIdx).trim();
    } else if (hasTrailingSpace && !trimmed.includes(',')) {
      bookPart = trimmed;
      rest = '';
    }

    if (bookPart) {
      const book = findBookClient(bookPart);
      if (book) {
        const commaIdx = rest.indexOf(',');
        if (commaIdx >= 0) {
          // Verse hint step
          const chapterStr = rest.substring(0, commaIdx);
          const chapter = parseInt(chapterStr);
          if (!isNaN(chapter)) {
            const maxVerse = getChapterVerseCount(book.id, chapter);
            const afterComma = rest.substring(commaIdx + 1);
            if (maxVerse > 0 && !afterComma) {
              return {
                from: refStart,
                options: [{
                  label: `Vers 1\u2013${maxVerse}`,
                  detail: `${book.short_name} ${chapter}`,
                  boost: 1,
                  apply: '', // Don't insert anything, just inform
                }],
              };
            }
          }
          return null;
        }

        // Chapter step
        const chapterFilter = rest.replace(/\D/g, '');
        const options = [];
        for (let ch = 1; ch <= book.chapters; ch++) {
          if (chapterFilter && !String(ch).startsWith(chapterFilter)) continue;
          const verseCount = getChapterVerseCount(book.id, ch);
          const displayName = booksData.find(b => b.id === book.id)?.short_name || bookPart;
          options.push({
            label: `${displayName} ${ch}`,
            detail: `${verseCount} vers`,
            apply: `${displayName} ${ch},`,
          });
        }
        if (options.length > 0) {
          return {
            from: refStart,
            options: options.slice(0, 15),
          };
        }
        return null;
      }
    }
  }

  // Book suggestions (for both [ref:] and [vers:])
  const bookQuery = query.trim();
  const suggestions = getBookSuggestions(bookQuery);
  if (suggestions.length === 0 && bookQuery.length === 0) {
    // Show all books when empty
    const allBooks = booksData.slice(0, 15).map(b => ({
      label: refType === 'ref' ? b.short_name : b.short_name.toLowerCase(),
      detail: b.name_no,
      apply: refType === 'ref' ? `${b.short_name} ` : `${b.short_name.toLowerCase()}-`,
    }));
    return { from: refStart, options: allBooks };
  }
  if (suggestions.length > 0) {
    return {
      from: refStart,
      options: suggestions.map(s => {
        const book = booksData.find(b => b.short_name.toLowerCase() === s.slug);
        const displayName = book?.short_name || s.slug;
        return {
          label: refType === 'ref' ? displayName : s.slug,
          detail: s.name,
          apply: refType === 'ref' ? `${displayName} ` : `${s.slug}-`,
        };
      }),
    };
  }

  return null;
}
