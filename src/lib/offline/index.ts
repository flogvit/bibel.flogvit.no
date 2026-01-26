/**
 * Offline Support Module
 *
 * This module provides offline functionality for the Bible app:
 * - IndexedDB storage for user data and cached content
 * - Service Worker registration and communication
 * - Offline search capabilities
 */

// Database and storage
export {
  getOfflineDb,
  closeOfflineDb,
  deleteOfflineDb,
  isOfflineStorageAvailable,
  type StoredVerse,
  type StoredWord4Word,
  type StoredChapter,
  type StoredBook,
  type StoredReference,
  type CacheMetadata,
  type ReadingPlanData,
} from './db';

export {
  // User data
  getUserData,
  setUserData,
  deleteUserData,
  getAllUserDataKeys,
  // Books
  getStoredBook,
  getAllStoredBooks,
  storeBook,
  storeBooks,
  // Chapters
  getStoredChapter,
  storeChapter,
  getChaptersForBook,
  getAllCachedChapters,
  deleteChapter,
  deleteAllChapters,
  // References
  getStoredReferences,
  storeReferences,
  getReferencesForChapter,
  // Reading plans
  getStoredReadingPlan,
  getAllStoredReadingPlans,
  storeReadingPlan,
  storeReadingPlans,
  // Cache metadata
  getCacheMetadata,
  updateCacheMetadata,
  deleteCacheMetadata,
  getAllCacheMetadata,
  // Statistics
  getCacheStats,
  isChapterCached,
  getCachedChaptersList,
  type CacheStats,
} from './storage';

// User data abstraction
export {
  getFavorites,
  saveFavorites,
  getNotes,
  saveNotes,
  getTopics,
  saveTopics,
  getSettings,
  saveSettings,
  getActivePlanId,
  setActivePlanId,
  getAllPlanProgress,
  savePlanProgress,
  getPlanProgress,
  saveSinglePlanProgress,
  migrateToIndexedDB,
  hasMigrated,
  markMigrationComplete,
  defaultSettings,
  type FavoriteVerse,
  type Note,
  type Topic,
  type VerseTopic,
  type TopicsData,
  type FontSize,
  type BibleVersion,
  type BibleSettings,
  type ReadingPlanProgress,
} from './userData';

// Service Worker
export {
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  getCacheSize,
  clearAllCaches,
  precacheChapter,
  precacheChapters,
  getCachedChapters,
  getCachedVersion,
  getServerVersion,
  checkForUpdates as checkForSWUpdates,
  isServiceWorkerActive,
  waitForServiceWorker,
  type CacheSize,
  type PrecacheResult,
  type CachedChapter,
  type VersionInfo,
} from './register-sw';

// Sync
export {
  getLocalSyncVersion,
  setLocalSyncVersion,
  checkForUpdates,
  syncIncrementally,
  getPendingUpdateCount,
  type SyncProgress,
} from './sync';

// Offline search
export {
  searchOffline,
  getCachedChapterCount,
  isOfflineSearchAvailable,
  type OfflineSearchResult,
  type OfflineSearchResponse,
} from './search';
