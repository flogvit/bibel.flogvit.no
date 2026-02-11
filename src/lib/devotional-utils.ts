import type { Devotional, DevotionalVersion } from '@/types/devotional';
import { getBookInfoBySlug, booksData } from '@/lib/books-data';
import { parseStandardRef } from '@/lib/standard-ref-parser';

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a new DevotionalVersion
 */
export function createVersion(content = '', name = ''): DevotionalVersion {
  return {
    id: generateId(),
    name,
    content,
    createdAt: Date.now(),
    locked: false,
    presentations: [],
  };
}

/**
 * Get the current draft (last unlocked version)
 */
export function getCurrentDraft(d: Devotional): DevotionalVersion | undefined {
  for (let i = d.versions.length - 1; i >= 0; i--) {
    if (!d.versions[i].locked) return d.versions[i];
  }
  return undefined;
}

/**
 * Get the current editable content
 */
export function getCurrentContent(d: Devotional): string {
  return getCurrentDraft(d)?.content ?? '';
}

/**
 * Get all locked versions
 */
export function getLockedVersions(d: Devotional): DevotionalVersion[] {
  return d.versions.filter(v => v.locked);
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug;
  let i = 2;
  while (existingSlugs.includes(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

/**
 * Extract verse references from markdown content.
 * Supports both legacy [vers:joh-3-16] and new [ref:Joh 3,16] formats.
 */
export function extractVerseRefs(content: string): string[] {
  // Legacy format: [vers:joh-3-16]
  const versRefs = [...content.matchAll(/\[vers:([^\]]+)\]/g)]
    .map(m => m[1].trim().toLowerCase());

  // New format: [ref:Joh 3,16-19]
  const refRefs = [...content.matchAll(/\[ref:([^\]]+)\]/g)].flatMap(m => {
    const segments = parseStandardRef(m[1].trim());
    return segments.map(s => {
      const firstVerse = s.verses?.[0] || s.fromVerse || 1;
      return `${s.bookShortName.toLowerCase()}-${s.chapter}-${firstVerse}`;
    });
  });

  return [...new Set([...versRefs, ...refRefs])];
}

/**
 * Convert a verse ref like "joh-3-16" to a readable name like "Joh 3:16"
 */
export function verseRefToReadable(ref: string): string {
  const parts = ref.split('-');
  if (parts.length < 3) return ref;

  // Handle book names that may have numbers (1mos, 2kor, etc.)
  // Try matching from longest possible book slug
  for (let i = parts.length - 2; i >= 1; i--) {
    const bookSlug = parts.slice(0, i).join('');
    const book = getBookInfoBySlug(bookSlug);
    if (book) {
      const chapter = parts[i];
      const verse = parts.slice(i + 1).join('-');
      return `${book.short_name} ${chapter}:${verse}`;
    }
  }

  return ref;
}

/**
 * Convert a verse ref like "joh-3-16" to a URL like "/joh/3#v16"
 */
export function verseRefToUrl(ref: string): string {
  const parts = ref.split('-');
  if (parts.length < 3) return '#';

  for (let i = parts.length - 2; i >= 1; i--) {
    const bookSlug = parts.slice(0, i).join('');
    const book = getBookInfoBySlug(bookSlug);
    if (book) {
      const chapter = parts[i];
      const verse = parts[i + 1];
      return `/${book.short_name.toLowerCase()}/${chapter}#v${verse}`;
    }
  }

  return '#';
}

/**
 * Get related devotionals scored by shared verses, tags, and type
 */
export function getRelatedDevotionals(
  devotional: Devotional,
  allDevotionals: Devotional[],
  limit = 5,
): Devotional[] {
  const scored = allDevotionals
    .filter(d => d.id !== devotional.id)
    .map(d => {
      let score = 0;

      // Shared verses: +3 each
      for (const ref of d.verses) {
        if (devotional.verses.includes(ref)) score += 3;
      }

      // Shared tags: +2 each
      for (const tag of d.tags) {
        if (devotional.tags.includes(tag)) score += 2;
      }

      // Same type: +1
      if (d.type === devotional.type) score += 1;

      return { devotional: d, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(s => s.devotional);
}

/**
 * Extract unique chapter references from markdown content.
 * Returns deduplicated and sorted {bookId, chapter}[] from [ref:...] and [vers:...] tags.
 */
export function extractChapterRefs(content: string): { bookId: number; chapter: number }[] {
  const seen = new Set<string>();
  const result: { bookId: number; chapter: number }[] = [];

  function add(bookId: number, chapter: number) {
    const key = `${bookId}:${chapter}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ bookId, chapter });
    }
  }

  // [ref:Joh 3,16] format
  for (const m of content.matchAll(/\[ref:([^\]]+)\]/g)) {
    const segments = parseStandardRef(m[1].trim());
    for (const s of segments) {
      add(s.bookId, s.chapter);
    }
  }

  // [vers:joh-3-16] format
  for (const m of content.matchAll(/\[vers:([^\]]+)\]/g)) {
    const parts = m[1].trim().toLowerCase().split('-');
    // Try to find book slug (may be multi-part like "1mos")
    for (let i = parts.length - 2; i >= 1; i--) {
      const bookSlug = parts.slice(0, i).join('');
      const book = getBookInfoBySlug(bookSlug);
      if (book) {
        const chapter = parseInt(parts[i]);
        if (!isNaN(chapter)) {
          add(book.id, chapter);
        }
        break;
      }
    }
  }

  // Sort by bookId, then chapter
  result.sort((a, b) => a.bookId - b.bookId || a.chapter - b.chapter);
  return result;
}

/**
 * Get auto-complete suggestions for verse references while typing
 */
export function getBookSuggestions(input: string): { slug: string; name: string }[] {
  if (!input) return [];
  const lower = input.toLowerCase();
  return booksData
    .filter(b =>
      b.short_name.toLowerCase().startsWith(lower) ||
      b.name_no.toLowerCase().startsWith(lower)
    )
    .map(b => ({ slug: b.short_name.toLowerCase(), name: b.name_no }))
    .slice(0, 8);
}
