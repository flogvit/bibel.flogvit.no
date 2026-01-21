import { Book, getAllBooks, getBookById, getBookUrlSlug } from './bible';

/**
 * Mapping of aliases to book IDs
 * Supports various Norwegian spellings and abbreviations
 */
const bookAliases: Record<string, number> = {
  // 1. Mosebok (Genesis)
  '1mos': 1, '1 mos': 1, '1.mos': 1, '1. mos': 1, '1.mosebok': 1, '1. mosebok': 1,
  'genesis': 1, 'gen': 1,

  // 2. Mosebok (Exodus)
  '2mos': 2, '2 mos': 2, '2.mos': 2, '2. mos': 2, '2.mosebok': 2, '2. mosebok': 2,
  'exodus': 2, '2m': 2,

  // 3. Mosebok (Leviticus)
  '3mos': 3, '3 mos': 3, '3.mos': 3, '3. mos': 3, '3.mosebok': 3, '3. mosebok': 3,
  'leviticus': 3, '3m': 3,

  // 4. Mosebok (Numbers)
  '4mos': 4, '4 mos': 4, '4.mos': 4, '4. mos': 4, '4.mosebok': 4, '4. mosebok': 4,
  'numbers': 4, '4m': 4,

  // 5. Mosebok (Deuteronomy)
  '5mos': 5, '5 mos': 5, '5.mos': 5, '5. mos': 5, '5.mosebok': 5, '5. mosebok': 5,
  'deuteronomy': 5, '5m': 5,

  // Josva
  'jos': 6, 'josva': 6, 'joshua': 6,

  // Dommerne
  'dom': 7, 'dommerne': 7, 'judges': 7,

  // Rut
  'rut': 8, 'ruth': 8,

  // Samuel
  '1sam': 9, '1 sam': 9, '1.sam': 9, '1. sam': 9, '1.samuel': 9, '1. samuel': 9,
  '2sam': 10, '2 sam': 10, '2.sam': 10, '2. sam': 10, '2.samuel': 10, '2. samuel': 10,

  // Kongebøkene
  '1kong': 11, '1 kong': 11, '1.kong': 11, '1. kong': 11, '1.kongebok': 11, '1. kongebok': 11, '1kings': 11,
  '2kong': 12, '2 kong': 12, '2.kong': 12, '2. kong': 12, '2.kongebok': 12, '2. kongebok': 12, '2kings': 12,

  // Krønikebøkene
  '1krøn': 13, '1 krøn': 13, '1.krøn': 13, '1. krøn': 13, '1.krønikebok': 13, '1. krønikebok': 13,
  '1kron': 13, '1 kron': 13, '1.kron': 13, '1. kron': 13, '1chronicles': 13,
  '2krøn': 14, '2 krøn': 14, '2.krøn': 14, '2. krøn': 14, '2.krønikebok': 14, '2. krønikebok': 14,
  '2kron': 14, '2 kron': 14, '2.kron': 14, '2. kron': 14, '2chronicles': 14,

  // Esra
  'esr': 15, 'esra': 15, 'ezra': 15,

  // Nehemja
  'neh': 16, 'nehemja': 16, 'nehemiah': 16,

  // Ester
  'est': 17, 'ester': 17, 'esther': 17,

  // Job
  'job': 18,

  // Salmene
  'sal': 19, 'salme': 19, 'salmene': 19, 'psalms': 19, 'psalm': 19, 'ps': 19,

  // Ordspråkene
  'ord': 20, 'ordsp': 20, 'ordspråkene': 20, 'proverbs': 20, 'prov': 20,

  // Forkynneren
  'fork': 21, 'forkynneren': 21, 'ecclesiastes': 21, 'eccl': 21,

  // Høysangen
  'høy': 22, 'høysangen': 22, 'song': 22, 'sos': 22,
  'hoy': 22, 'hoysangen': 22,

  // Jesaja
  'jes': 23, 'jesaja': 23, 'isaiah': 23, 'isa': 23,

  // Jeremia
  'jer': 24, 'jeremia': 24, 'jeremiah': 24,

  // Klagesangene
  'klag': 25, 'klagesangene': 25, 'lamentations': 25, 'lam': 25,

  // Esekiel
  'esek': 26, 'esekiel': 26, 'ezekiel': 26, 'ezek': 26,

  // Daniel
  'dan': 27, 'daniel': 27,

  // Hosea
  'hos': 28, 'hosea': 28,

  // Joel
  'joel': 29,

  // Amos
  'amos': 30, 'am': 30,

  // Obadja
  'ob': 31, 'obadja': 31, 'obadiah': 31,

  // Jona
  'jona': 32, 'jonah': 32,

  // Mika
  'mika': 33, 'micah': 33, 'mic': 33,

  // Nahum
  'nah': 34, 'nahum': 34,

  // Habakkuk
  'hab': 35, 'habakkuk': 35,

  // Sefanja
  'sef': 36, 'sefanja': 36, 'zephaniah': 36, 'zeph': 36,

  // Haggai
  'hag': 37, 'haggai': 37,

  // Sakarja
  'sak': 38, 'sakarja': 38, 'zechariah': 38, 'zech': 38,

  // Malaki
  'mal': 39, 'malaki': 39, 'malachi': 39,

  // Matteus
  'matt': 40, 'mat': 40, 'matteus': 40, 'matthew': 40, 'mt': 40,

  // Markus
  'mark': 41, 'markus': 41, 'mk': 41,

  // Lukas
  'luk': 42, 'lukas': 42, 'luke': 42, 'lk': 42,

  // Johannes
  'joh': 43, 'johannes': 43, 'john': 43, 'jn': 43,

  // Apostlenes gjerninger
  'apg': 44, 'apostlenes gjerninger': 44, 'acts': 44, 'ag': 44,

  // Romerne
  'rom': 45, 'romerne': 45, 'romans': 45,

  // Korinterbrevene
  '1kor': 46, '1 kor': 46, '1.kor': 46, '1. kor': 46, '1.korinter': 46, '1. korinter': 46, '1corinthians': 46,
  '2kor': 47, '2 kor': 47, '2.kor': 47, '2. kor': 47, '2.korinter': 47, '2. korinter': 47, '2corinthians': 47,

  // Galaterne
  'gal': 48, 'galaterne': 48, 'galatians': 48,

  // Efeserne
  'ef': 49, 'efeserne': 49, 'ephesians': 49, 'eph': 49,

  // Filipperne
  'fil': 50, 'filipperne': 50, 'philippians': 50, 'phil': 50,

  // Kolosserne
  'kol': 51, 'kolosserne': 51, 'colossians': 51, 'col': 51,

  // Tessalonikerbrevene
  '1tess': 52, '1 tess': 52, '1.tess': 52, '1. tess': 52, '1.tessaloniker': 52, '1. tessaloniker': 52,
  '2tess': 53, '2 tess': 53, '2.tess': 53, '2. tess': 53, '2.tessaloniker': 53, '2. tessaloniker': 53,

  // Timoteusbrevene
  '1tim': 54, '1 tim': 54, '1.tim': 54, '1. tim': 54, '1.timoteus': 54, '1. timoteus': 54,
  '2tim': 55, '2 tim': 55, '2.tim': 55, '2. tim': 55, '2.timoteus': 55, '2. timoteus': 55,

  // Titus
  'tit': 56, 'titus': 56,

  // Filemon
  'filem': 57, 'filemon': 57, 'philemon': 57, 'phlm': 57,

  // Hebreerne
  'hebr': 58, 'hebreerne': 58, 'hebrews': 58, 'heb': 58,

  // Jakob
  'jak': 59, 'jakob': 59, 'james': 59, 'jas': 59,

  // Peters brev
  '1pet': 60, '1 pet': 60, '1.pet': 60, '1. pet': 60, '1.peter': 60, '1. peter': 60,
  '2pet': 61, '2 pet': 61, '2.pet': 61, '2. pet': 61, '2.peter': 61, '2. peter': 61,

  // Johannes' brev
  '1joh': 62, '1 joh': 62, '1.joh': 62, '1. joh': 62, '1.johannes': 62, '1. johannes': 62,
  '2joh': 63, '2 joh': 63, '2.joh': 63, '2. joh': 63, '2.johannes': 63, '2. johannes': 63,
  '3joh': 64, '3 joh': 64, '3.joh': 64, '3. joh': 64, '3.johannes': 64, '3. johannes': 64,

  // Judas
  'jud': 65, 'judas': 65, 'jude': 65,

  // Åpenbaringen
  'åp': 66, 'åpenb': 66, 'åpenbaringen': 66, 'revelation': 66, 'rev': 66,
  'ap': 66, 'apenb': 66, 'apenbaringen': 66, // uten norsk ø/å
};

export interface ParsedReference {
  book: Book;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  url: string;
}

export interface BookSuggestion {
  book: Book;
  matchedAlias: string;
}

export interface ParseResult {
  success: boolean;
  reference?: ParsedReference;
  suggestions?: BookSuggestion[];
  error?: string;
  partial?: {
    book?: Book;
    chapter?: number;
  };
}

/**
 * Normalize input for comparison
 */
function normalizeInput(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Find book by alias or partial match
 */
export function findBook(input: string): Book | undefined {
  const normalized = normalizeInput(input);

  // Direct alias match
  if (bookAliases[normalized]) {
    return getBookById(bookAliases[normalized]);
  }

  // Try matching short_name directly
  const books = getAllBooks();
  const shortMatch = books.find(b => b.short_name.toLowerCase() === normalized);
  if (shortMatch) return shortMatch;

  // Try matching full Norwegian name
  const nameMatch = books.find(b => b.name_no.toLowerCase() === normalized);
  if (nameMatch) return nameMatch;

  return undefined;
}

/**
 * Get book suggestions based on partial input
 */
export function getBookSuggestions(input: string): BookSuggestion[] {
  const normalized = normalizeInput(input);
  if (!normalized) return [];

  const books = getAllBooks();
  const suggestions: BookSuggestion[] = [];
  const seenBookIds = new Set<number>();

  // Check all aliases for partial matches
  for (const [alias, bookId] of Object.entries(bookAliases)) {
    if (alias.startsWith(normalized) && !seenBookIds.has(bookId)) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        suggestions.push({ book, matchedAlias: alias });
        seenBookIds.add(bookId);
      }
    }
  }

  // Also check short_name and name_no
  for (const book of books) {
    if (seenBookIds.has(book.id)) continue;

    if (book.short_name.toLowerCase().startsWith(normalized)) {
      suggestions.push({ book, matchedAlias: book.short_name });
      seenBookIds.add(book.id);
    } else if (book.name_no.toLowerCase().startsWith(normalized)) {
      suggestions.push({ book, matchedAlias: book.name_no });
      seenBookIds.add(book.id);
    }
  }

  // Sort by book ID for consistent ordering
  return suggestions.sort((a, b) => a.book.id - b.book.id);
}

/**
 * Parse a Bible reference string
 * Supports formats like:
 * - "mat 4,5" or "matt 4:5" or "matteus 4.5"
 * - "1 mos 3,16" or "1mos 3:16"
 * - "joh 3:16-17" (verse range)
 * - "sal 23" (whole chapter)
 */
export function parseReference(input: string): ParseResult {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return { success: false, error: 'Tom input' };
  }

  // Pattern to match book name (with optional number prefix) and chapter/verse
  // Examples: "1 mos 3,16", "matt 4:5", "sal 23", "joh 3:16-17"
  const pattern = /^(\d?\s*\.?\s*[a-zæøå]+)\s*(\d+)?(?:[,:.\s]+(\d+))?(?:\s*[-–]\s*(\d+))?$/i;
  const match = normalized.match(pattern);

  if (!match) {
    // Try to at least find a book match for suggestions
    const suggestions = getBookSuggestions(normalized);
    if (suggestions.length > 0) {
      return {
        success: false,
        suggestions,
        partial: { book: suggestions[0].book }
      };
    }
    return { success: false, error: 'Ugyldig format' };
  }

  const [, bookPart, chapterStr, verseStartStr, verseEndStr] = match;

  // Find the book
  const book = findBook(bookPart.trim());

  if (!book) {
    const suggestions = getBookSuggestions(bookPart.trim());
    if (suggestions.length > 0) {
      return { success: false, suggestions, error: 'Fant ikke bok' };
    }
    return { success: false, error: 'Fant ikke bok' };
  }

  // If no chapter specified, return partial result
  if (!chapterStr) {
    return {
      success: false,
      partial: { book },
      error: 'Mangler kapittel'
    };
  }

  const chapter = parseInt(chapterStr, 10);

  // Validate chapter
  if (chapter < 1 || chapter > book.chapters) {
    return {
      success: false,
      partial: { book },
      error: `${book.name_no} har ${book.chapters} kapitler`
    };
  }

  const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : undefined;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : verseStart;

  // Build URL with ASCII-safe slug
  const urlSlug = getBookUrlSlug(book);
  let url = `/${urlSlug}/${chapter}`;
  if (verseStart) {
    url += `#v${verseStart}`;
  }

  return {
    success: true,
    reference: {
      book,
      chapter,
      verseStart,
      verseEnd,
      url
    }
  };
}

/**
 * Check if input looks like a Bible reference
 */
export function looksLikeReference(input: string): boolean {
  const normalized = normalizeInput(input);
  if (!normalized) return false;

  // Check if it starts with something that could be a book name
  const bookPattern = /^(\d?\s*\.?\s*)?[a-zæøå]{2,}/i;
  if (!bookPattern.test(normalized)) return false;

  // Check if there's a number after the potential book name
  const hasNumber = /[a-zæøå]\s*\d/.test(normalized);

  // Or check if the input matches known book aliases/names
  const suggestions = getBookSuggestions(normalized.split(/[\s\d]/)[0]);

  return hasNumber || suggestions.length > 0;
}

/**
 * Format a reference for display
 */
export function formatParsedReference(ref: ParsedReference): string {
  let result = `${ref.book.name_no} ${ref.chapter}`;
  if (ref.verseStart) {
    result += `:${ref.verseStart}`;
    if (ref.verseEnd && ref.verseEnd !== ref.verseStart) {
      result += `-${ref.verseEnd}`;
    }
  }
  return result;
}
