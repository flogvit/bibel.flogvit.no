/**
 * URL utility functions that can be used in both client and server components
 */

/**
 * Convert Norwegian characters to ASCII for URL-safe slugs
 * å/Å → a, ø/Ø → o, æ/Æ → ae
 */
export function toUrlSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae');
}
