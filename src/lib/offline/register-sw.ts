/**
 * Service Worker Registration and Communication
 *
 * Handles SW lifecycle and provides functions to interact with the SW.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          console.log('[SW] New content available');
          // Dispatch event for UI to show update notification
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    console.log('[SW] Service worker registered');
    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    return true;
  }

  return swRegistration.unregister();
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (!swRegistration?.waiting) return;

  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Send message to service worker and wait for response
 * Returns null if no service worker is active
 */
async function sendMessage<T>(message: { type: string; payload?: unknown }): Promise<T | null> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      // No active service worker - return null instead of throwing
      resolve(null);
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data as T);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);

    // Timeout after 10 seconds - resolve with null instead of rejecting
    setTimeout(() => resolve(null), 10000);
  });
}

/**
 * Get cache size information
 */
export interface CacheSize {
  totalSize: number;
  totalSizeMB: string;
  chapterCount: number;
}

export async function getCacheSize(): Promise<CacheSize | null> {
  return await sendMessage<CacheSize>({ type: 'GET_CACHE_SIZE' });
}

/**
 * Clear all caches (both Service Worker cache and IndexedDB)
 */
export async function clearAllCaches(): Promise<boolean> {
  try {
    // Clear Service Worker cache (may be null if no SW active)
    await sendMessage({ type: 'CLEAR_CACHE' });

    // Clear IndexedDB data
    const { deleteAllChapters, deleteAllSupportingData } = await import('./storage');
    await deleteAllChapters();
    await deleteAllSupportingData();

    return true;
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Precache a specific chapter
 */
export async function precacheChapter(
  bookId: number,
  chapter: number,
  bible = 'osnb2'
): Promise<boolean> {
  const url = `/api/chapter?book=${bookId}&chapter=${chapter}&bible=${bible}`;
  const result = await sendMessage({ type: 'PRECACHE_CHAPTER', payload: { url } });
  return result !== null;
}

/**
 * Precache multiple chapters (both API data and page HTML)
 */
export interface PrecacheResult {
  success: boolean;
  cached: number;
  failed: number;
}

export async function precacheChapters(
  chapters: { bookId: number; chapter: number; bible?: string; slug?: string }[]
): Promise<PrecacheResult> {
  // Build list of URLs to cache: both API and page URLs
  const urls: string[] = [];

  for (const ch of chapters) {
    const bible = ch.bible || 'osnb2';
    // API URL for data
    urls.push(`/api/chapter?book=${ch.bookId}&chapter=${ch.chapter}&bible=${bible}`);
    // Page URL for HTML (only if slug is provided)
    if (ch.slug) {
      const pageUrl = bible === 'osnb2'
        ? `/${ch.slug}/${ch.chapter}`
        : `/${ch.slug}/${ch.chapter}?bible=${bible}`;
      urls.push(pageUrl);
    }
  }

  const result = await sendMessage<PrecacheResult>({
    type: 'PRECACHE_CHAPTERS',
    payload: { urls },
  });

  return result ?? { success: false, cached: 0, failed: chapters.length };
}

/**
 * Precache supporting data (books, plans, timeline, etc.)
 */
export const SUPPORTING_DATA_URLS = [
  '/api/books',
  '/api/reading-plans',
  '/api/timeline',
  '/api/prophecies',
  '/api/persons',
  // Also cache the pages
  '/leseplan',
  '/tidslinje',
  '/profetier',
  '/personer',
  '/kjente-vers',
  '/temaer',
];

export async function precacheSupportingData(): Promise<PrecacheResult> {
  const result = await sendMessage<PrecacheResult>({
    type: 'PRECACHE_CHAPTERS',
    payload: { urls: SUPPORTING_DATA_URLS },
  });

  return result ?? { success: false, cached: 0, failed: SUPPORTING_DATA_URLS.length };
}

/**
 * Check which supporting data URLs are cached
 */
export async function getCachedSupportingData(): Promise<string[]> {
  try {
    const cached: string[] = [];

    for (const url of SUPPORTING_DATA_URLS) {
      const response = await caches.match(url);
      if (response) {
        cached.push(url);
      }
    }

    return cached;
  } catch (error) {
    console.error('[SW] Failed to check cached supporting data:', error);
    return [];
  }
}

/**
 * Get list of cached chapters from service worker cache
 */
export interface CachedChapter {
  bookId: number;
  chapter: number;
  bible: string;
}

export async function getCachedChapters(): Promise<CachedChapter[]> {
  const result = await sendMessage<CachedChapter[]>({ type: 'GET_CACHED_CHAPTERS' });
  return result ?? [];
}

/**
 * Version information
 */
export interface VersionInfo {
  hasUpdate: boolean;
  serverVersion: string | null;
  cachedVersion: string | null;
  chaptersToRefresh: number;
  reason?: string;
  error?: string;
}

/**
 * Get the cached database version from service worker
 */
export async function getCachedVersion(): Promise<string | null> {
  return await sendMessage<string | null>({ type: 'GET_CACHED_VERSION' });
}

/**
 * Check for database updates
 */
export async function checkForUpdates(): Promise<VersionInfo> {
  const result = await sendMessage<VersionInfo>({ type: 'CHECK_VERSION' });

  return result ?? {
    hasUpdate: false,
    serverVersion: null,
    cachedVersion: null,
    chaptersToRefresh: 0,
    error: 'Kunne ikke sjekke for oppdateringer',
  };
}

/**
 * Get the server database version directly from API
 */
export async function getServerVersion(): Promise<{ version: string; importedAt: string | null } | null> {
  try {
    const response = await fetch('/api/version');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[SW] Failed to get server version:', error);
    return null;
  }
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerActive(): boolean {
  return typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    !!navigator.serviceWorker.controller;
}

/**
 * Wait for service worker to be ready
 */
export async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('[SW] Failed to wait for service worker:', error);
    return null;
  }
}
