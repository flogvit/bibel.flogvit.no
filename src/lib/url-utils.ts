/**
 * URL utility functions that can be used in both client and server components
 */

/**
 * Convert book short names to URL slugs.
 * Preserves Norwegian characters (ø, æ, å) since routes use them.
 */
export function toUrlSlug(text: string): string {
  return text.toLowerCase();
}
