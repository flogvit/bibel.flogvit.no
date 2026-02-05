/**
 * User Data Abstraction Layer
 *
 * This module provides async get/set functions for user data storage.
 * It uses IndexedDB as primary storage with localStorage as fallback.
 * Handles automatic migration from localStorage to IndexedDB.
 */

import { getUserData, setUserData } from './storage';
import { isOfflineStorageAvailable } from './db';

// Storage keys
const STORAGE_KEYS = {
  favorites: 'bible-favorites',
  notes: 'bible-notes',
  topics: 'bible-topics',
  settings: 'bible-settings',
  activePlan: 'activeReadingPlan',
  planProgress: 'readingPlanProgress',
  readingPosition: 'bible-reading-position',
  verseVersions: 'bible-verse-versions',
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

// Track if we've migrated data from localStorage
const MIGRATION_KEY = 'bibel-idb-migrated';

// ============================================
// Core Storage Functions
// ============================================

/**
 * Check if we should use IndexedDB (available and not SSR)
 */
async function shouldUseIndexedDB(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return isOfflineStorageAvailable();
}

/**
 * Get data from localStorage (fallback)
 */
function getFromLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save data to localStorage (fallback)
 */
function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore errors (e.g., quota exceeded)
  }
}

/**
 * Generic get function that tries IndexedDB first, falls back to localStorage
 */
async function getData<T>(storageKey: StorageKey, defaultValue: T): Promise<T> {
  const localStorageKey = STORAGE_KEYS[storageKey];

  if (await shouldUseIndexedDB()) {
    // Try IndexedDB first
    const idbData = await getUserData<T>(storageKey);
    if (idbData !== null) {
      return idbData;
    }

    // Check for localStorage data that needs migration
    const localData = getFromLocalStorage<T>(localStorageKey);
    if (localData !== null) {
      // Migrate to IndexedDB
      await setUserData(storageKey, localData);
      return localData;
    }

    return defaultValue;
  }

  // Fallback to localStorage
  const localData = getFromLocalStorage<T>(localStorageKey);
  return localData !== null ? localData : defaultValue;
}

/**
 * Generic save function that saves to both IndexedDB and localStorage
 */
async function saveData<T>(storageKey: StorageKey, data: T): Promise<void> {
  const localStorageKey = STORAGE_KEYS[storageKey];

  // Always save to localStorage for compatibility
  saveToLocalStorage(localStorageKey, data);

  // Also save to IndexedDB if available
  if (await shouldUseIndexedDB()) {
    await setUserData(storageKey, data);
  }
}

// ============================================
// Favorites
// ============================================

export interface FavoriteVerse {
  bookId: number;
  chapter: number;
  verse: number;
}

export async function getFavorites(): Promise<FavoriteVerse[]> {
  return getData<FavoriteVerse[]>('favorites', []);
}

export async function saveFavorites(favorites: FavoriteVerse[]): Promise<void> {
  return saveData('favorites', favorites);
}

// ============================================
// Notes
// ============================================

export interface Note {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export async function getNotes(): Promise<Note[]> {
  return getData<Note[]>('notes', []);
}

export async function saveNotes(notes: Note[]): Promise<void> {
  return saveData('notes', notes);
}

// ============================================
// Topics
// ============================================

export interface Topic {
  id: string;
  name: string;
}

// Generisk tagging - støtter alle typer innhold
export type ItemType = 'verse' | 'note' | 'prophecy' | 'timeline' | 'person' | 'readingplan' | 'theme';

export interface ItemTopic {
  itemType: ItemType;
  itemId: string;      // Unik ID basert på type (f.eks. "1-1-1" for vers)
  topicId: string;
}

// Legacy interface - beholdes for bakoverkompatibilitet
export interface VerseTopic {
  bookId: number;
  chapter: number;
  verse: number;
  topicId: string;
}

export interface TopicsData {
  topics: Topic[];
  verseTopics: VerseTopic[];  // Legacy - migreres til itemTopics
  itemTopics: ItemTopic[];    // Ny generisk struktur
}

// Hjelpefunksjon for å generere vers-ID
export function getVerseItemId(bookId: number, chapter: number, verse: number): string {
  return `${bookId}-${chapter}-${verse}`;
}

// Hjelpefunksjon for å parse vers-ID
export function parseVerseItemId(itemId: string): { bookId: number; chapter: number; verse: number } | null {
  const parts = itemId.split('-');
  if (parts.length !== 3) return null;
  const [bookId, chapter, verse] = parts.map(Number);
  if (isNaN(bookId) || isNaN(chapter) || isNaN(verse)) return null;
  return { bookId, chapter, verse };
}

export async function getTopics(): Promise<TopicsData> {
  const data = await getData<TopicsData>('topics', { topics: [], verseTopics: [], itemTopics: [] });

  // Migrer gamle verseTopics til itemTopics hvis nødvendig
  if (data.verseTopics.length > 0 && data.itemTopics.length === 0) {
    data.itemTopics = data.verseTopics.map(vt => ({
      itemType: 'verse' as ItemType,
      itemId: getVerseItemId(vt.bookId, vt.chapter, vt.verse),
      topicId: vt.topicId
    }));
  }

  // Sørg for at itemTopics alltid eksisterer
  if (!data.itemTopics) {
    data.itemTopics = [];
  }

  return data;
}

export async function saveTopics(data: TopicsData): Promise<void> {
  return saveData('topics', data);
}

// ============================================
// Settings
// ============================================

export type FontSize = 'small' | 'medium' | 'large';
export type BibleVersion = 'osnb2' | 'osnn1';

export interface BibleSettings {
  showBookSummary: boolean;
  showChapterSummary: boolean;
  showChapterContext: boolean;
  showChapterInsights: boolean;
  showImportantWords: boolean;
  showWord4Word: boolean;
  showVerseDetails: boolean;
  showVerseIndicators: boolean;
  showOriginalText: boolean;
  showTimeline: boolean;
  readingMode: boolean;
  fontSize: FontSize;
  darkMode: boolean;
  bible: BibleVersion;
}

export const defaultSettings: BibleSettings = {
  showBookSummary: true,
  showChapterSummary: true,
  showChapterContext: false,
  showChapterInsights: true,
  showImportantWords: false,
  showWord4Word: true,
  showVerseDetails: true,
  showVerseIndicators: false,
  showOriginalText: false,
  showTimeline: true,
  readingMode: false,
  fontSize: 'medium',
  darkMode: false,
  bible: 'osnb2',
};

export async function getSettings(): Promise<BibleSettings> {
  const stored = await getData<Partial<BibleSettings>>('settings', {});
  return { ...defaultSettings, ...stored };
}

export async function saveSettings(settings: BibleSettings): Promise<void> {
  return saveData('settings', settings);
}

// ============================================
// Reading Plan Progress
// ============================================

export interface ReadingPlanProgress {
  planId: string;
  startDate: string;
  completedDays: number[];
  lastReadDate: string | null;
}

export async function getActivePlanId(): Promise<string | null> {
  return getData<string | null>('activePlan', null);
}

export async function setActivePlanId(planId: string | null): Promise<void> {
  if (planId === null) {
    // Clear from both storages
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.activePlan);
    }
    if (await shouldUseIndexedDB()) {
      const { deleteUserData } = await import('./storage');
      await deleteUserData('activePlan');
    }
    return;
  }
  return saveData('activePlan', planId);
}

export async function getAllPlanProgress(): Promise<Record<string, ReadingPlanProgress>> {
  return getData<Record<string, ReadingPlanProgress>>('planProgress', {});
}

export async function savePlanProgress(progress: Record<string, ReadingPlanProgress>): Promise<void> {
  return saveData('planProgress', progress);
}

export async function getPlanProgress(planId: string): Promise<ReadingPlanProgress | null> {
  const allProgress = await getAllPlanProgress();
  return allProgress[planId] || null;
}

export async function saveSinglePlanProgress(planId: string, progress: ReadingPlanProgress): Promise<void> {
  const allProgress = await getAllPlanProgress();
  allProgress[planId] = progress;
  return savePlanProgress(allProgress);
}

// ============================================
// Reading Position
// ============================================

export interface ReadingPosition {
  bookId: number;
  chapter: number;
  verse: number;
  timestamp: number;
  bookSlug: string;
  bookName: string;
}

export async function getReadingPosition(): Promise<ReadingPosition | null> {
  return getData<ReadingPosition | null>('readingPosition', null);
}

export async function saveReadingPosition(position: ReadingPosition | null): Promise<void> {
  if (position === null) {
    // Clear from both storages
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.readingPosition);
    }
    if (await shouldUseIndexedDB()) {
      const { deleteUserData } = await import('./storage');
      await deleteUserData('readingPosition');
    }
    return;
  }
  return saveData('readingPosition', position);
}

// ============================================
// Verse Versions
// ============================================

// Maps verse key (bookId-chapter-verse) to selected version index
export type VerseVersionChoices = Record<string, number>;

export async function getVerseVersions(): Promise<VerseVersionChoices> {
  return getData<VerseVersionChoices>('verseVersions', {});
}

export async function saveVerseVersions(choices: VerseVersionChoices): Promise<void> {
  return saveData('verseVersions', choices);
}

// ============================================
// Migration Check
// ============================================

/**
 * Check if data has been migrated to IndexedDB
 */
export function hasMigrated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete
 */
export function markMigrationComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Perform full migration from localStorage to IndexedDB
 * This is called once on first load after IndexedDB support is added
 */
export async function migrateToIndexedDB(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (hasMigrated()) return;
  if (!(await shouldUseIndexedDB())) return;

  try {
    // Migrate each data type
    const favorites = getFromLocalStorage<FavoriteVerse[]>(STORAGE_KEYS.favorites);
    if (favorites) {
      await setUserData('favorites', favorites);
    }

    const notes = getFromLocalStorage<Note[]>(STORAGE_KEYS.notes);
    if (notes) {
      await setUserData('notes', notes);
    }

    const topics = getFromLocalStorage<TopicsData>(STORAGE_KEYS.topics);
    if (topics) {
      await setUserData('topics', topics);
    }

    const settings = getFromLocalStorage<BibleSettings>(STORAGE_KEYS.settings);
    if (settings) {
      await setUserData('settings', settings);
    }

    const activePlan = getFromLocalStorage<string>(STORAGE_KEYS.activePlan);
    if (activePlan) {
      await setUserData('activePlan', activePlan);
    }

    const planProgress = getFromLocalStorage<Record<string, ReadingPlanProgress>>(STORAGE_KEYS.planProgress);
    if (planProgress) {
      await setUserData('planProgress', planProgress);
    }

    const readingPosition = getFromLocalStorage<ReadingPosition>(STORAGE_KEYS.readingPosition);
    if (readingPosition) {
      await setUserData('readingPosition', readingPosition);
    }

    const verseVersions = getFromLocalStorage<VerseVersionChoices>(STORAGE_KEYS.verseVersions);
    if (verseVersions) {
      await setUserData('verseVersions', verseVersions);
    }

    markMigrationComplete();
    console.log('Successfully migrated user data to IndexedDB');
  } catch (error) {
    console.error('Failed to migrate user data to IndexedDB:', error);
    // Don't mark as migrated so we can try again
  }
}
