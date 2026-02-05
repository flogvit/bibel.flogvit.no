/**
 * Service Worker for bibel.flogvit.no
 *
 * Handles caching of:
 * - Static assets (JS/CSS/fonts) - Cache-first
 * - HTML pages - Stale-while-revalidate
 * - API /api/chapter - Network-first with cache fallback
 * - Other API - Network-first
 *
 * Also handles:
 * - Database version checking
 * - Cache invalidation when database is updated
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `bibel-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `bibel-dynamic-${CACHE_VERSION}`;
const API_CACHE = `bibel-api-${CACHE_VERSION}`;
const META_CACHE = `bibel-meta-${CACHE_VERSION}`;

// Key for storing the cached database version
const DB_VERSION_KEY = 'db-version';

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.json',
  '/offline-fallback',
];

// File extensions that should use cache-first
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return 'network-only';
  }

  // Skip chrome-extension and other non-http protocols
  if (!url.protocol.startsWith('http')) {
    return 'network-only';
  }

  // API endpoints that should use IndexedDB fallback when offline
  if (pathname.startsWith('/api/chapter') ||
      pathname === '/api/timeline' ||
      pathname === '/api/prophecies' ||
      pathname === '/api/persons' ||
      pathname === '/api/books' ||
      pathname === '/api/reading-plans' ||
      pathname === '/api/leseplan') {
    return 'network-first-api';
  }

  // Other API endpoints - network-only (no caching)
  if (pathname.startsWith('/api/')) {
    return 'network-only';
  }

  // Static assets - cache-first
  const hasStaticExtension = CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  if (hasStaticExtension) {
    return 'cache-first';
  }

  // Next.js static files - cache-first
  if (pathname.startsWith('/_next/static/')) {
    return 'cache-first';
  }

  // HTML pages - stale-while-revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    return 'stale-while-revalidate';
  }

  // Default - network-first
  return 'network-first';
}

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old version caches
            return name.startsWith('bibel-') && !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Notify all clients that a new SW has activated
      // This helps older clients know they should refresh
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            payload: { version: CACHE_VERSION },
          });
        });
      });
    })
  );

  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;

    case 'network-first':
      event.respondWith(networkFirst(event.request, DYNAMIC_CACHE));
      break;

    case 'network-first-api':
      event.respondWith(networkFirstApi(event.request));
      break;

    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;

    case 'network-only':
    default:
      // Let the browser handle it
      break;
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', error);
    // Return offline fallback page with the original path
    return redirectToOfflineFallback(request);
  }
}

// Network-first strategy with cache fallback
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network-first failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline fallback for HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
      return redirectToOfflineFallback(request);
    }
    throw error;
  }
}

// Network-first strategy specifically for API chapter endpoint
async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] API fetch failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      // Add header to indicate this is from cache
      const cachedResponse = cached.clone();
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // Try to get data from IndexedDB
    const url = new URL(request.url);
    const idbData = await getDataFromIndexedDB(url);
    if (idbData) {
      console.log('[SW] Returning data from IndexedDB');
      return new Response(JSON.stringify(idbData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-From-IndexedDB': 'true',
        },
      });
    }

    // Return error JSON
    return new Response(
      JSON.stringify({
        error: 'Offline and no cached data available',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  // Fetch in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] SWR fetch failed:', error);
      // If we have a cached version, return it
      if (cached) {
        return cached;
      }
      // Otherwise redirect to offline fallback
      return redirectToOfflineFallback(request);
    });

  // Return cached response immediately, or wait for network
  return cached || fetchPromise;
}

// Helper: Redirect to offline fallback page with original path
async function redirectToOfflineFallback(request) {
  const url = new URL(request.url);
  const originalPath = url.pathname + url.search;

  // Try to get the cached offline fallback page
  const fallbackUrl = `/offline-fallback?path=${encodeURIComponent(originalPath)}`;

  // First try to get the offline-fallback page from cache
  const cachedFallback = await caches.match('/offline-fallback');
  if (cachedFallback) {
    // Clone the response and modify its URL for proper client-side routing
    const responseBody = await cachedFallback.text();
    return new Response(responseBody, {
      headers: {
        'Content-Type': 'text/html',
        'X-Offline-Fallback': 'true',
        'X-Original-Path': originalPath,
      },
    });
  }

  // Fallback to basic offline page if offline-fallback not cached
  return new Response(`
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Bibelen</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
        }
        h1 { color: #2c3e50; }
        p { color: #666; }
        a { color: #8b7355; }
      </style>
    </head>
    <body>
      <h1>Du er offline</h1>
      <p>Siden du prøvde å åpne er ikke tilgjengelig offline.</p>
      <p>Forsøkt side: <code>${originalPath}</code></p>
      <p><a href="/offline">Se hva som er tilgjengelig offline</a></p>
      <script>
        // Store the original path for when the app loads
        sessionStorage.setItem('offlineFallbackPath', '${originalPath}');
      </script>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
      'X-Offline-Fallback': 'true',
      'X-Original-Path': originalPath,
    },
  });
}

// Message handler for cache management
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_SIZE':
      event.ports[0].postMessage(await getCacheSize());
      break;

    case 'CLEAR_CACHE':
      await clearAllCaches();
      event.ports[0].postMessage({ success: true });
      break;

    case 'PRECACHE_CHAPTER':
      // Precache a specific chapter
      if (payload?.url) {
        await precacheUrl(payload.url);
        event.ports[0].postMessage({ success: true });
      }
      break;

    case 'PRECACHE_CHAPTERS':
      // Precache multiple chapters
      if (payload?.urls) {
        const results = await Promise.allSettled(
          payload.urls.map(url => precacheUrl(url))
        );
        event.ports[0].postMessage({
          success: true,
          cached: results.filter(r => r.status === 'fulfilled').length,
          failed: results.filter(r => r.status === 'rejected').length,
        });
      }
      break;

    case 'GET_CACHED_CHAPTERS':
      event.ports[0].postMessage(await getCachedChapters());
      break;

    case 'CHECK_VERSION':
      // Check if there's a newer database version
      event.ports[0].postMessage(await checkForUpdates());
      break;

    case 'GET_CACHED_VERSION':
      // Get the currently cached database version
      event.ports[0].postMessage(await getCachedVersion());
      break;

    case 'REFRESH_ALL_CACHED':
      // Refresh all cached chapters with new data
      const refreshResult = await refreshAllCachedChapters(
        (progress) => {
          // Send progress updates to all clients
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'REFRESH_PROGRESS',
                payload: progress,
              });
            });
          });
        }
      );
      event.ports[0].postMessage(refreshResult);
      break;

    case 'SET_CACHED_VERSION':
      // Manually set the cached version (after successful refresh)
      if (payload?.version) {
        await setCachedVersion(payload.version);
        event.ports[0].postMessage({ success: true });
      }
      break;
  }
});

// ============================================
// Version checking functions
// ============================================

// Get the cached database version
async function getCachedVersion() {
  try {
    const cache = await caches.open(META_CACHE);
    const response = await cache.match(DB_VERSION_KEY);
    if (response) {
      const data = await response.json();
      return data.version || null;
    }
    return null;
  } catch (error) {
    console.error('[SW] Failed to get cached version:', error);
    return null;
  }
}

// Set the cached database version
async function setCachedVersion(version) {
  try {
    const cache = await caches.open(META_CACHE);
    const response = new Response(JSON.stringify({ version, updatedAt: Date.now() }), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(DB_VERSION_KEY, response);
    console.log('[SW] Cached version set to:', version);
  } catch (error) {
    console.error('[SW] Failed to set cached version:', error);
  }
}

// Check for updates by comparing cached version with server version
async function checkForUpdates() {
  try {
    // Fetch current server version
    const response = await fetch('/api/version', { cache: 'no-store' });
    if (!response.ok) {
      return { hasUpdate: false, error: 'Failed to fetch server version' };
    }

    const serverData = await response.json();
    const serverVersion = serverData.version;

    // Get cached version
    const cachedVersion = await getCachedVersion();

    // Check if we have any cached chapters
    const cachedChapters = await getCachedChapters();
    const hasCachedData = cachedChapters.length > 0;

    // If no cached data, no need to update
    if (!hasCachedData) {
      // But save the current version for future reference
      await setCachedVersion(serverVersion);
      return { hasUpdate: false, serverVersion, cachedVersion: null, reason: 'no-cached-data' };
    }

    // If no cached version, treat as needing update (first time with cached data)
    if (!cachedVersion) {
      return {
        hasUpdate: true,
        serverVersion,
        cachedVersion: null,
        reason: 'no-cached-version',
        chaptersToRefresh: cachedChapters.length,
      };
    }

    // Compare versions (string comparison works for ISO date format)
    const hasUpdate = serverVersion > cachedVersion;

    return {
      hasUpdate,
      serverVersion,
      cachedVersion,
      reason: hasUpdate ? 'version-mismatch' : 'up-to-date',
      chaptersToRefresh: hasUpdate ? cachedChapters.length : 0,
    };
  } catch (error) {
    console.error('[SW] Failed to check for updates:', error);
    return { hasUpdate: false, error: error.message };
  }
}

// Refresh all cached chapters
async function refreshAllCachedChapters(onProgress) {
  try {
    const cachedChapters = await getCachedChapters();
    const total = cachedChapters.length;

    if (total === 0) {
      return { success: true, refreshed: 0, total: 0 };
    }

    let refreshed = 0;
    let failed = 0;

    // Fetch new version first
    const versionResponse = await fetch('/api/version', { cache: 'no-store' });
    const { version: newVersion } = await versionResponse.json();

    // Refresh chapters in batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < cachedChapters.length; i += BATCH_SIZE) {
      const batch = cachedChapters.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (ch) => {
          const url = `/api/chapter?book=${ch.bookId}&chapter=${ch.chapter}&bible=${ch.bible}`;
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(url, response);
            return true;
          }
          throw new Error(`Failed to fetch ${url}`);
        })
      );

      refreshed += results.filter(r => r.status === 'fulfilled').length;
      failed += results.filter(r => r.status === 'rejected').length;

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + batch.length,
          total,
          refreshed,
          failed,
        });
      }
    }

    // Update cached version after successful refresh
    if (refreshed > 0) {
      await setCachedVersion(newVersion);
    }

    // Notify all clients that refresh is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'REFRESH_COMPLETE',
        payload: { refreshed, failed, total, newVersion },
      });
    });

    return { success: true, refreshed, failed, total, newVersion };
  } catch (error) {
    console.error('[SW] Failed to refresh cached chapters:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Cache helper functions
// ============================================

// Helper: Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  let chapterCount = 0;

  for (const name of cacheNames) {
    if (!name.startsWith('bibel-')) continue;

    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;

        // Count chapter API requests
        if (request.url.includes('/api/chapter')) {
          chapterCount++;
        }
      }
    }
  }

  return {
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    chapterCount,
  };
}

// Helper: Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('bibel-'))
      .map(name => caches.delete(name))
  );
}

// Helper: Precache a URL
async function precacheUrl(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      // Use appropriate cache based on URL type
      const isApiUrl = url.includes('/api/');
      const cacheName = isApiUrl ? API_CACHE : DYNAMIC_CACHE;
      const cache = await caches.open(cacheName);
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SW] Failed to precache:', url, error);
    return false;
  }
}

// Helper: Get list of cached chapters
async function getCachedChapters() {
  const cache = await caches.open(API_CACHE);
  const keys = await cache.keys();

  const chapters = [];
  for (const request of keys) {
    if (request.url.includes('/api/chapter')) {
      const url = new URL(request.url);
      const bookId = parseInt(url.searchParams.get('book') || '0', 10);
      const chapter = parseInt(url.searchParams.get('chapter') || '0', 10);
      const bible = url.searchParams.get('bible') || 'osnb2';

      if (bookId && chapter) {
        chapters.push({ bookId, chapter, bible });
      }
    }
  }

  return chapters;
}

// ============================================
// IndexedDB query functions for offline API
// ============================================

const IDB_NAME = 'bibel-offline';
const IDB_VERSION = 3;

// Open IndexedDB connection
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      // Don't create stores here - just open existing DB
      console.log('[SW] IndexedDB upgrade needed - database may not exist');
    };
  });
}

// Get data from IndexedDB based on API URL
async function getDataFromIndexedDB(url) {
  const pathname = url.pathname;

  try {
    const db = await openIndexedDB();

    // /api/chapter?book=X&chapter=Y&bible=Z
    if (pathname === '/api/chapter') {
      const bookId = parseInt(url.searchParams.get('book') || '0', 10);
      const chapter = parseInt(url.searchParams.get('chapter') || '0', 10);
      const bible = url.searchParams.get('bible') || 'osnb2';

      if (bookId && chapter) {
        const data = await getChapterFromIDB(db, bookId, chapter, bible);
        db.close();
        return data;
      }
    }

    // /api/timeline
    if (pathname === '/api/timeline') {
      const data = await getTimelineFromIDB(db);
      db.close();
      return data;
    }

    // /api/prophecies
    if (pathname === '/api/prophecies') {
      const data = await getPropheciesFromIDB(db);
      db.close();
      return data;
    }

    // /api/persons
    if (pathname === '/api/persons') {
      const data = await getPersonsFromIDB(db);
      db.close();
      return data;
    }

    // /api/reading-plans
    if (pathname === '/api/reading-plans' || pathname === '/api/leseplan') {
      const data = await getReadingPlansFromIDB(db);
      db.close();
      return data;
    }

    // /api/books
    if (pathname === '/api/books') {
      const data = await getBooksFromIDB(db);
      db.close();
      return data;
    }

    db.close();
    return null;
  } catch (error) {
    console.error('[SW] IndexedDB query failed:', error);
    return null;
  }
}

// Get chapter from IndexedDB
function getChapterFromIDB(db, bookId, chapter, bible) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('chapters')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const request = store.get([bookId, chapter, bible]);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        // Transform to match API response format
        resolve({
          bookId: data.bookId,
          chapter: data.chapter,
          bible: data.bible,
          verses: data.verses,
          originalVerses: data.originalVerses || [],
          word4word: data.word4word || {},
          references: data.references || {},
          summary: data.summary || null,
          context: data.context || null,
          insight: data.insight || null,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}

// Get timeline from IndexedDB
function getTimelineFromIDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('timeline')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('timeline', 'readonly');
    const store = tx.objectStore('timeline');
    const request = store.get('data');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        resolve({
          periods: data.periods,
          events: data.events,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}

// Get prophecies from IndexedDB
function getPropheciesFromIDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('prophecies')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('prophecies', 'readonly');
    const store = tx.objectStore('prophecies');
    const request = store.get('data');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        resolve({
          categories: data.categories,
          prophecies: data.prophecies,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}

// Get persons from IndexedDB
function getPersonsFromIDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('persons')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('persons', 'readonly');
    const store = tx.objectStore('persons');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data && data.length > 0) {
        resolve({
          persons: data,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}

// Get reading plans from IndexedDB
function getReadingPlansFromIDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('readingPlans')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('readingPlans', 'readonly');
    const store = tx.objectStore('readingPlans');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data && data.length > 0) {
        resolve({
          plans: data,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}

// Get books from IndexedDB
function getBooksFromIDB(db) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('books')) {
      resolve(null);
      return;
    }

    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      if (data && data.length > 0) {
        resolve({
          books: data,
          fromIndexedDB: true,
        });
      } else {
        resolve(null);
      }
    };
  });
}
