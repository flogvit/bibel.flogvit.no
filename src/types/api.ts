import type { Verse, Word4Word, Reference } from '@/lib/bible';

export interface ChapterAPIResponse {
  bookId: number;
  chapter: number;
  bible: string;
  verses: Verse[];
  originalVerses: { verse: number; text: string }[];
  word4word: Record<number, Word4Word[]>;
  references: Record<number, Reference[]>;
  bookSummary: string | null;
  summary: string | null;
  context: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insight: any | null;
  cachedAt: number;
}

export interface SyncStatusResponse {
  currentVersion: number;
  lastUpdated: string;
  changes: {
    chapters: string[];
    timeline: boolean;
    prophecies: boolean;
    persons: string[];
    readingPlans: string[];
  };
}

export interface SyncChaptersResponse {
  chapters: Record<string, ChapterAPIResponse>;
}
