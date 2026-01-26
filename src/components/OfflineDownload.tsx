

import { useState, useEffect, useCallback, useRef } from 'react';
import { precacheChapters, CachedChapter, precacheSupportingData } from '@/lib/offline/register-sw';
import {
  storeBooks,
  getAllStoredBooks,
  storeChapter,
  getAllCachedChapters,
  storeTimeline,
  storeProphecies,
  storePersons,
  storeReadingPlans,
} from '@/lib/offline/storage';
import { checkForUpdates, syncIncrementally, SyncProgress, setLocalSyncVersion } from '@/lib/offline/sync';
import type { StoredChapter, StoredTimelineData, StoredProphecyData, StoredPersonData, ReadingPlanData } from '@/lib/offline/db';
import type { ChapterAPIResponse } from '@/types/api';
import styles from './OfflineDownload.module.scss';

// Book data - 66 books with their chapter counts and URL slugs
const BIBLE_BOOKS = [
  { id: 1, name: '1. Mosebok', slug: '1mos', chapters: 50 },
  { id: 2, name: '2. Mosebok', slug: '2mos', chapters: 40 },
  { id: 3, name: '3. Mosebok', slug: '3mos', chapters: 27 },
  { id: 4, name: '4. Mosebok', slug: '4mos', chapters: 36 },
  { id: 5, name: '5. Mosebok', slug: '5mos', chapters: 34 },
  { id: 6, name: 'Josva', slug: 'jos', chapters: 24 },
  { id: 7, name: 'Dommerne', slug: 'dom', chapters: 21 },
  { id: 8, name: 'Rut', slug: 'rut', chapters: 4 },
  { id: 9, name: '1. Samuel', slug: '1sam', chapters: 31 },
  { id: 10, name: '2. Samuel', slug: '2sam', chapters: 24 },
  { id: 11, name: '1. Kongebok', slug: '1kong', chapters: 22 },
  { id: 12, name: '2. Kongebok', slug: '2kong', chapters: 25 },
  { id: 13, name: '1. Krønikebok', slug: '1kron', chapters: 29 },
  { id: 14, name: '2. Krønikebok', slug: '2kron', chapters: 36 },
  { id: 15, name: 'Esra', slug: 'esr', chapters: 10 },
  { id: 16, name: 'Nehemja', slug: 'neh', chapters: 13 },
  { id: 17, name: 'Ester', slug: 'est', chapters: 10 },
  { id: 18, name: 'Job', slug: 'job', chapters: 42 },
  { id: 19, name: 'Salmene', slug: 'sal', chapters: 150 },
  { id: 20, name: 'Ordspråkene', slug: 'ord', chapters: 31 },
  { id: 21, name: 'Forkynneren', slug: 'fork', chapters: 12 },
  { id: 22, name: 'Høysangen', slug: 'hoy', chapters: 8 },
  { id: 23, name: 'Jesaja', slug: 'jes', chapters: 66 },
  { id: 24, name: 'Jeremia', slug: 'jer', chapters: 52 },
  { id: 25, name: 'Klagesangene', slug: 'klag', chapters: 5 },
  { id: 26, name: 'Esekiel', slug: 'esek', chapters: 48 },
  { id: 27, name: 'Daniel', slug: 'dan', chapters: 12 },
  { id: 28, name: 'Hosea', slug: 'hos', chapters: 14 },
  { id: 29, name: 'Joel', slug: 'joel', chapters: 3 },
  { id: 30, name: 'Amos', slug: 'amos', chapters: 9 },
  { id: 31, name: 'Obadja', slug: 'ob', chapters: 1 },
  { id: 32, name: 'Jona', slug: 'jona', chapters: 4 },
  { id: 33, name: 'Mika', slug: 'mika', chapters: 7 },
  { id: 34, name: 'Nahum', slug: 'nah', chapters: 3 },
  { id: 35, name: 'Habakkuk', slug: 'hab', chapters: 3 },
  { id: 36, name: 'Sefanja', slug: 'sef', chapters: 3 },
  { id: 37, name: 'Haggai', slug: 'hag', chapters: 2 },
  { id: 38, name: 'Sakarja', slug: 'sak', chapters: 14 },
  { id: 39, name: 'Malaki', slug: 'mal', chapters: 3 },
  { id: 40, name: 'Matteus', slug: 'matt', chapters: 28 },
  { id: 41, name: 'Markus', slug: 'mark', chapters: 16 },
  { id: 42, name: 'Lukas', slug: 'luk', chapters: 24 },
  { id: 43, name: 'Johannes', slug: 'joh', chapters: 21 },
  { id: 44, name: 'Apostlenes gjerninger', slug: 'apg', chapters: 28 },
  { id: 45, name: 'Romerne', slug: 'rom', chapters: 16 },
  { id: 46, name: '1. Korinter', slug: '1kor', chapters: 16 },
  { id: 47, name: '2. Korinter', slug: '2kor', chapters: 13 },
  { id: 48, name: 'Galaterne', slug: 'gal', chapters: 6 },
  { id: 49, name: 'Efeserne', slug: 'ef', chapters: 6 },
  { id: 50, name: 'Filipperne', slug: 'fil', chapters: 4 },
  { id: 51, name: 'Kolosserne', slug: 'kol', chapters: 4 },
  { id: 52, name: '1. Tessaloniker', slug: '1tess', chapters: 5 },
  { id: 53, name: '2. Tessaloniker', slug: '2tess', chapters: 3 },
  { id: 54, name: '1. Timoteus', slug: '1tim', chapters: 6 },
  { id: 55, name: '2. Timoteus', slug: '2tim', chapters: 4 },
  { id: 56, name: 'Titus', slug: 'tit', chapters: 3 },
  { id: 57, name: 'Filemon', slug: 'filem', chapters: 1 },
  { id: 58, name: 'Hebreerne', slug: 'hebr', chapters: 13 },
  { id: 59, name: 'Jakob', slug: 'jak', chapters: 5 },
  { id: 60, name: '1. Peter', slug: '1pet', chapters: 5 },
  { id: 61, name: '2. Peter', slug: '2pet', chapters: 3 },
  { id: 62, name: '1. Johannes', slug: '1joh', chapters: 5 },
  { id: 63, name: '2. Johannes', slug: '2joh', chapters: 1 },
  { id: 64, name: '3. Johannes', slug: '3joh', chapters: 1 },
  { id: 65, name: 'Judas', slug: 'jud', chapters: 1 },
  { id: 66, name: 'Åpenbaringen', slug: 'ap', chapters: 22 },
];

const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0); // 1189

type BibleVersion = 'osnb2' | 'osnn1';

interface DownloadProgress {
  current: number;
  total: number;
  currentBook: string;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
  skippedChapters?: string[]; // Chapters that returned 404
}

interface OfflineDownloadProps {
  onDownloadComplete?: () => void;
}

export function OfflineDownload({ onDownloadComplete }: OfflineDownloadProps) {
  const [selectedVersions, setSelectedVersions] = useState<BibleVersion[]>(['osnb2']);
  const [cachedChapters, setCachedChapters] = useState<CachedChapter[]>([]);
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    currentBook: '',
    status: 'idle',
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update tracking state
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cached chapters from IndexedDB on mount
  useEffect(() => {
    async function loadCached() {
      const chapters = await getAllCachedChapters();
      const cached: CachedChapter[] = chapters.map(ch => ({
        bookId: ch.bookId,
        chapter: ch.chapter,
        bible: ch.bible,
      }));
      setCachedChapters(cached);

      // Check for updates if we have cached data
      if (cached.length > 0) {
        checkForPendingUpdates();
      }
    }
    loadCached();
  }, []);

  // Check for pending updates
  const checkForPendingUpdates = useCallback(async () => {
    try {
      const updates = await checkForUpdates();
      const count =
        updates.changedChapters.length +
        (updates.timelineChanged ? 1 : 0) +
        (updates.propheciesChanged ? 1 : 0) +
        updates.changedPersons.length +
        updates.changedReadingPlans.length;
      setPendingUpdates(count);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, []);

  // Perform incremental sync
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(null);

    try {
      const result = await syncIncrementally(
        (progress) => setSyncProgress(progress),
        selectedVersions[0] || 'osnb2'
      );

      if (result.success) {
        // Reload cached chapters
        const chapters = await getAllCachedChapters();
        const cached: CachedChapter[] = chapters.map(ch => ({
          bookId: ch.bookId,
          chapter: ch.chapter,
          bible: ch.bible,
        }));
        setCachedChapters(cached);
        setPendingUpdates(0);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedVersions]);

  // Count how many chapters are already cached for a version
  const getCachedCount = useCallback((bible: BibleVersion): number => {
    return cachedChapters.filter(c => c.bible === bible).length;
  }, [cachedChapters]);

  // Estimate download size
  const estimateSize = useCallback((versions: BibleVersion[]): string => {
    // Approximate: ~30KB per chapter per version
    const chaptersToDownload = versions.reduce((sum, bible) => {
      return sum + TOTAL_CHAPTERS - getCachedCount(bible);
    }, 0);
    const sizeMB = (chaptersToDownload * 30) / 1024;
    return sizeMB.toFixed(1);
  }, [getCachedCount]);

  // Start downloading
  const startDownload = async () => {
    if (selectedVersions.length === 0) return;

    abortControllerRef.current = new AbortController();

    // Build list of chapters to download
    const chaptersToDownload: { bookId: number; chapter: number; bible: BibleVersion; bookName: string; slug: string }[] = [];

    for (const bible of selectedVersions) {
      for (const book of BIBLE_BOOKS) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
          // Skip if already cached
          const isCached = cachedChapters.some(
            c => c.bookId === book.id && c.chapter === chapter && c.bible === bible
          );
          if (!isCached) {
            chaptersToDownload.push({
              bookId: book.id,
              chapter,
              bible,
              bookName: book.name,
              slug: book.slug,
            });
          }
        }
      }
    }

    if (chaptersToDownload.length === 0) {
      // No chapters to download, but still download supporting data
      setProgress({
        current: 0,
        total: 0,
        currentBook: 'Støttedata...',
        status: 'downloading',
      });
    } else {

    setProgress({
      current: 0,
      total: chaptersToDownload.length,
      currentBook: chaptersToDownload[0].bookName,
      status: 'downloading',
    });

    // Download in batches of 5
    const BATCH_SIZE = 5;

    for (let i = 0; i < chaptersToDownload.length; i += BATCH_SIZE) {
      if (abortControllerRef.current?.signal.aborted) {
        setProgress(p => ({ ...p, status: 'paused' }));
        return;
      }

      const batch = chaptersToDownload.slice(i, i + BATCH_SIZE);
      const currentChapter = batch[0];

      setProgress(p => ({
        ...p,
        current: i,
        currentBook: currentChapter.bookName,
      }));

      try {
        // Fetch chapter data and store in IndexedDB
        const successfulChapters: typeof batch = [];
        const skipped: string[] = [];
        await Promise.all(batch.map(async (ch) => {
          const url = `/api/chapter?book=${ch.bookId}&chapter=${ch.chapter}&bible=${ch.bible}`;
          const response = await fetch(url);

          // Skip chapters that don't exist (e.g., Joel 4 in some versions)
          if (response.status === 404) {
            console.log(`Skipping non-existent chapter: ${ch.bookName} ${ch.chapter}`);
            skipped.push(`${ch.bookName} ${ch.chapter}`);
            return;
          }

          if (!response.ok) throw new Error(`Failed to fetch ${url}`);

          const data: ChapterAPIResponse = await response.json();

          // Store in IndexedDB for persistent offline access
          const storedChapter: StoredChapter = {
            bookId: data.bookId,
            chapter: data.chapter,
            bible: data.bible,
            verses: data.verses,
            originalVerses: data.originalVerses,
            word4word: data.word4word,
            references: data.references,
            summary: data.summary,
            context: data.context,
            insight: data.insight,
            cachedAt: data.cachedAt,
          };
          await storeChapter(storedChapter);
          successfulChapters.push(ch);
        }));

        // Track skipped chapters
        if (skipped.length > 0) {
          setProgress(p => ({
            ...p,
            skippedChapters: [...(p.skippedChapters || []), ...skipped],
          }));
        }

        // Also cache the page URLs in Service Worker for quick page loads
        if (successfulChapters.length > 0) {
          await precacheChapters(successfulChapters);
        }
      } catch (error) {
        console.error('Download error:', error);
        setProgress(p => ({
          ...p,
          status: 'error',
          error: 'Nedlasting feilet. Sjekk internettforbindelsen.',
        }));
        return;
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Reload cached chapters from IndexedDB
    const chapters = await getAllCachedChapters();
    const cached: CachedChapter[] = chapters.map(ch => ({
      bookId: ch.bookId,
      chapter: ch.chapter,
      bible: ch.bible,
    }));
    setCachedChapters(cached);

    // Also cache the book list in IndexedDB
    const storedBooks = await getAllStoredBooks();
    if (storedBooks.length === 0) {
      await storeBooks(BIBLE_BOOKS.map(b => ({
        id: b.id,
        name: b.name,
        name_no: b.name,
        short_name: b.name.substring(0, 3),
        testament: b.id <= 39 ? 'GT' : 'NT',
        chapters: b.chapters,
      })));
    }
    } // end else (chapters to download)

    // Download supporting data (plans, timeline, prophecies, etc.)
    setProgress(p => ({
      ...p,
      currentBook: 'Støttedata (leseplaner, tidslinje...)',
    }));

    // Fetch and store supporting data in IndexedDB
    try {
      // Fetch timeline data
      const timelineResponse = await fetch('/api/timeline');
      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        const storedTimeline: StoredTimelineData = {
          ...timelineData,
          cachedAt: Date.now(),
        };
        await storeTimeline(storedTimeline);
      }

      // Fetch prophecies data
      const propheciesResponse = await fetch('/api/prophecies');
      if (propheciesResponse.ok) {
        const propheciesData = await propheciesResponse.json();
        const storedProphecies: StoredProphecyData = {
          ...propheciesData,
          cachedAt: Date.now(),
        };
        await storeProphecies(storedProphecies);
      }

      // Fetch persons data
      const personsResponse = await fetch('/api/persons');
      if (personsResponse.ok) {
        const personsData: StoredPersonData[] = await personsResponse.json();
        await storePersons(personsData);
      }

      // Fetch reading plans
      const plansResponse = await fetch('/api/reading-plans');
      if (plansResponse.ok) {
        const plansSummary = await plansResponse.json();
        // Fetch each plan's full data
        const fullPlans: ReadingPlanData[] = [];
        for (const plan of plansSummary) {
          const planResponse = await fetch(`/api/reading-plans/${plan.id}`);
          if (planResponse.ok) {
            const planData = await planResponse.json();
            fullPlans.push(planData);
          }
        }
        if (fullPlans.length > 0) {
          await storeReadingPlans(fullPlans);
        }
      }
    } catch (error) {
      console.error('Failed to download supporting data:', error);
    }

    // Also cache HTML pages in Service Worker for quick navigation
    await precacheSupportingData();

    // Set the sync version from server
    try {
      const versionResponse = await fetch('/api/version');
      if (versionResponse.ok) {
        const versionData = await versionResponse.json();
        await setLocalSyncVersion(versionData.syncVersion);
      }
    } catch (error) {
      console.error('Failed to set sync version:', error);
    }

    setProgress({
      current: chaptersToDownload.length,
      total: chaptersToDownload.length,
      currentBook: '',
      status: 'completed',
    });

    // Notify parent that download is complete
    onDownloadComplete?.();
  };

  const pauseDownload = () => {
    abortControllerRef.current?.abort();
  };

  const toggleVersion = (version: BibleVersion) => {
    setSelectedVersions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version);
      }
      return [...prev, version];
    });
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Last ned for offline-bruk</h2>

      <div className={styles.versions}>
        <label className={styles.versionOption}>
          <input
            type="checkbox"
            checked={selectedVersions.includes('osnb2')}
            onChange={() => toggleVersion('osnb2')}
            disabled={progress.status === 'downloading'}
          />
          <span>Bokmål</span>
          <span className={styles.cachedInfo}>
            ({getCachedCount('osnb2')}/{TOTAL_CHAPTERS} kapitler)
          </span>
        </label>

        <label className={styles.versionOption}>
          <input
            type="checkbox"
            checked={selectedVersions.includes('osnn1')}
            onChange={() => toggleVersion('osnn1')}
            disabled={progress.status === 'downloading'}
          />
          <span>Nynorsk</span>
          <span className={styles.cachedInfo}>
            ({getCachedCount('osnn1')}/{TOTAL_CHAPTERS} kapitler)
          </span>
        </label>
      </div>

      <div className={styles.supportingDataSection}>
        <p className={styles.supportingDataLabel}>Støttedata (lastes ned automatisk):</p>
        <ul className={styles.supportingDataList}>
          <li>Tidslinje med bibelske hendelser</li>
          <li>Profetier og oppfyllelser</li>
          <li>Bibelske personer</li>
          <li>Leseplaner</li>
        </ul>
      </div>

      {progress.status === 'idle' && selectedVersions.length > 0 && (
        <p className={styles.estimate}>
          Estimert nedlasting: ~{estimateSize(selectedVersions)} MB
        </p>
      )}

      {progress.status === 'downloading' && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={styles.progressText}>
            Laster ned {progress.currentBook}... ({progress.current}/{progress.total})
          </p>
        </div>
      )}

      {progress.status === 'completed' && (
        <div className={styles.success}>
          <p>Nedlasting fullført! Bibelen er nå tilgjengelig offline.</p>
          {progress.skippedChapters && progress.skippedChapters.length > 0 && (
            <p className={styles.skippedNote}>
              {progress.skippedChapters.length} kapittel finnes ikke i denne versjonen: {progress.skippedChapters.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Update notice when there are pending updates */}
      {pendingUpdates > 0 && !isSyncing && progress.status !== 'downloading' && (
        <div className={styles.updateNotice}>
          <p>{pendingUpdates} oppdatering{pendingUpdates > 1 ? 'er' : ''} tilgjengelig</p>
          <button
            className={styles.updateButton}
            onClick={handleSync}
            disabled={isSyncing}
          >
            Oppdater nå
          </button>
        </div>
      )}

      {/* Sync progress */}
      {isSyncing && syncProgress && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: syncProgress.total > 0
                  ? `${Math.round((syncProgress.current / syncProgress.total) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          <p className={styles.progressText}>{syncProgress.message}</p>
        </div>
      )}

      {progress.status === 'error' && (
        <p className={styles.error}>{progress.error}</p>
      )}

      {progress.status === 'paused' && (
        <p className={styles.paused}>
          Nedlasting satt på pause. Du kan fortsette når som helst.
        </p>
      )}

      <div className={styles.actions}>
        {(progress.status === 'idle' || progress.status === 'paused' || progress.status === 'error') && (
          <button
            className={styles.downloadButton}
            onClick={startDownload}
            disabled={selectedVersions.length === 0}
          >
            {progress.status === 'paused' ? 'Fortsett nedlasting' : 'Start nedlasting'}
          </button>
        )}

        {progress.status === 'downloading' && (
          <button
            className={styles.pauseButton}
            onClick={pauseDownload}
          >
            Pause
          </button>
        )}
      </div>

      <p className={styles.description}>
        Last ned hele Bibelen for å lese uten internettforbindelse.
        Nedlastingen kan ta noen minutter avhengig av tilkoblingen din.
      </p>
    </div>
  );
}
