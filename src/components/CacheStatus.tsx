

import { useState, useEffect } from 'react';
import { getCacheSize, CacheSize, clearAllCaches, getCachedVersion, getServerVersion } from '@/lib/offline/register-sw';
import { getCacheStats, CacheStats, getSupportingDataStatus, SupportingDataStatus } from '@/lib/offline/storage';
import { forceDeleteDatabase } from '@/lib/offline/db';
import styles from './CacheStatus.module.scss';

interface CombinedCacheStats {
  sw: CacheSize | null;
  idb: CacheStats | null;
  storageEstimate: { usage: number; quota: number } | null;
}

interface VersionState {
  cached: string | null;
  server: string | null;
}


function formatVersion(version: string | null): string {
  if (!version) return 'Ukjent';
  // Version is in format "YYYY-MM-DD HH:MM:SS"
  try {
    const [date, time] = version.split(' ');
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year} kl. ${time.substring(0, 5)}`;
  } catch {
    return version;
  }
}

export function CacheStatus() {
  const [stats, setStats] = useState<CombinedCacheStats>({ sw: null, idb: null, storageEstimate: null });
  const [versions, setVersions] = useState<VersionState>({ cached: null, server: null });
  const [supportingData, setSupportingData] = useState<SupportingDataStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  async function loadStats() {
    setIsLoading(true);
    try {
      // Add timeout to prevent hanging forever
      const timeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
        ]);
      };

      // Get storage estimate using the Storage API
      const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
        if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
          try {
            const estimate = await navigator.storage.estimate();
            return {
              usage: estimate.usage || 0,
              quota: estimate.quota || 0,
            };
          } catch {
            return null;
          }
        }
        return null;
      };

      const [sw, idb, cachedVersion, serverVersionData, supportingDataStatus, storageEstimate] = await Promise.all([
        timeout(getCacheSize(), 5000, null),
        timeout(getCacheStats(), 5000, {
          chaptersCount: 0,
          booksCount: 0,
          referencesCount: 0,
          cachedBibles: [],
          cachedChaptersByBible: {},
        }),
        timeout(getCachedVersion(), 5000, null),
        timeout(getServerVersion(), 5000, null),
        timeout(getSupportingDataStatus(), 5000, {
          hasTimeline: false,
          hasProphecies: false,
          personsCount: 0,
          readingPlansCount: 0,
        }),
        timeout(getStorageEstimate(), 5000, null),
      ]);
      setStats({ sw, idb, storageEstimate });
      setVersions({
        cached: cachedVersion,
        server: serverVersionData?.version || null,
      });
      setSupportingData(supportingDataStatus);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleClearCache() {
    if (!confirm('Er du sikker på at du vil slette alle nedlastede data? Du må laste ned på nytt for å lese offline.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllCaches();
      await loadStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
    setIsClearing(false);
  }

  async function handleResetDatabase() {
    if (!confirm('Dette vil slette hele offline-databasen og tilbakestille den. Bruk dette hvis du opplever problemer. Fortsette?')) {
      return;
    }

    setIsClearing(true);
    try {
      // Force delete the database immediately
      const deleted = await forceDeleteDatabase();
      console.log('[CacheStatus] Force delete result:', deleted);

      // Reload stats to show empty state
      await loadStats();
    } catch (error) {
      console.error('Failed to reset database:', error);
    }
    setIsClearing(false);
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Laster cache-statistikk...</p>
      </div>
    );
  }

  // Chapters are stored in IndexedDB (persistent), SW cache is just for page HTML
  const totalChapters = stats.idb?.chaptersCount || 0;
  // Use Storage API estimate for actual storage usage
  const totalSizeMB = stats.storageEstimate
    ? (stats.storageEstimate.usage / (1024 * 1024)).toFixed(1)
    : '0';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Offline-lagring</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Nedlastede kapitler</span>
          <span className={styles.value}>{totalChapters}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>Brukt lagringsplass</span>
          <span className={styles.value}>{totalSizeMB} MB</span>
        </div>

        {stats.idb && stats.idb.cachedBibles.length > 0 && (
          <div className={styles.stat}>
            <span className={styles.label}>Bibelversjoner</span>
            <span className={styles.value}>
              {stats.idb.cachedBibles.map(b => {
                const label = b === 'osnb2' ? 'Bokmål' : b === 'osnn1' ? 'Nynorsk' : b;
                const count = stats.idb!.cachedChaptersByBible[b] || 0;
                return `${label} (${count})`;
              }).join(', ')}
            </span>
          </div>
        )}

        {supportingData && (
          <div className={styles.stat}>
            <span className={styles.label}>Støttedata</span>
            <span className={styles.value}>
              {!supportingData.hasTimeline && !supportingData.hasProphecies && supportingData.personsCount === 0 && supportingData.readingPlansCount === 0
                ? 'Ikke lastet ned'
                : [
                    supportingData.hasTimeline ? 'Tidslinje' : null,
                    supportingData.hasProphecies ? 'Profetier' : null,
                    supportingData.personsCount > 0 ? `${supportingData.personsCount} personer` : null,
                    supportingData.readingPlansCount > 0 ? `${supportingData.readingPlansCount} leseplaner` : null,
                  ].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {supportingData && (supportingData.hasTimeline || supportingData.hasProphecies || supportingData.personsCount > 0) &&
         (!supportingData.hasTimeline || !supportingData.hasProphecies || supportingData.personsCount === 0 || supportingData.readingPlansCount === 0) && (
          <div className={styles.supportingDataDetails}>
            <span className={styles.smallLabel}>Mangler:</span>
            <span className={styles.smallValue}>
              {[
                !supportingData.hasTimeline ? 'Tidslinje' : null,
                !supportingData.hasProphecies ? 'Profetier' : null,
                supportingData.personsCount === 0 ? 'Personer' : null,
                supportingData.readingPlansCount === 0 ? 'Leseplaner' : null,
              ].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {versions.cached && (
          <div className={styles.stat}>
            <span className={styles.label}>Offline-data fra</span>
            <span className={styles.value}>{formatVersion(versions.cached)}</span>
          </div>
        )}

        {versions.server && (
          <div className={styles.stat}>
            <span className={styles.label}>Siste oppdatering</span>
            <span className={versions.cached && versions.server > versions.cached ? styles.updateAvailable : styles.value}>
              {formatVersion(versions.server)}
              {versions.cached && versions.server > versions.cached && ' (ny!)'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.refreshButton}
          onClick={loadStats}
          disabled={isClearing}
        >
          Oppdater
        </button>

        <button
          className={styles.clearButton}
          onClick={handleClearCache}
          disabled={isClearing}
        >
          {isClearing ? 'Sletter...' : 'Slett cache'}
        </button>

        <button
          className={styles.resetButton}
          onClick={handleResetDatabase}
          disabled={isClearing}
        >
          Tilbakestill
        </button>
      </div>

      <p className={styles.description}>
        Kapitler lastes ned automatisk når du leser dem. De blir da tilgjengelige offline.
        Bruk «Tilbakestill» hvis du opplever problemer med nedlasting.
      </p>
    </div>
  );
}
