import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CacheStatus } from '@/components/CacheStatus';
import { OfflineDownload } from '@/components/OfflineDownload';
import { getAllCachedChapters, getSupportingDataStatus, SupportingDataStatus } from '@/lib/offline/storage';

interface CachedChapter {
  bookId: number;
  chapter: number;
  bible: string;
}
import styles from '@/styles/pages/offline.module.scss';

// Book names for display
const bookNames: Record<number, string> = {
  1: '1. Mosebok', 2: '2. Mosebok', 3: '3. Mosebok', 4: '4. Mosebok', 5: '5. Mosebok',
  6: 'Josva', 7: 'Dommerne', 8: 'Rut', 9: '1. Samuel', 10: '2. Samuel',
  11: '1. Kongebok', 12: '2. Kongebok', 13: '1. Krønikebok', 14: '2. Krønikebok',
  15: 'Esra', 16: 'Nehemja', 17: 'Ester', 18: 'Job', 19: 'Salmene',
  20: 'Ordspråkene', 21: 'Forkynneren', 22: 'Høysangen', 23: 'Jesaja', 24: 'Jeremia',
  25: 'Klagesangene', 26: 'Esekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel',
  30: 'Amos', 31: 'Obadja', 32: 'Jona', 33: 'Mika', 34: 'Nahum',
  35: 'Habakkuk', 36: 'Sefanja', 37: 'Haggai', 38: 'Sakarja', 39: 'Malaki',
  40: 'Matteus', 41: 'Markus', 42: 'Lukas', 43: 'Johannes', 44: 'Apostlenes gjerninger',
  45: 'Romerne', 46: '1. Korinter', 47: '2. Korinter', 48: 'Galaterne', 49: 'Efeserne',
  50: 'Filipperne', 51: 'Kolosserne', 52: '1. Tessaloniker', 53: '2. Tessaloniker',
  54: '1. Timoteus', 55: '2. Timoteus', 56: 'Titus', 57: 'Filemon', 58: 'Hebreerne',
  59: 'Jakob', 60: '1. Peter', 61: '2. Peter', 62: '1. Johannes', 63: '2. Johannes',
  64: '3. Johannes', 65: 'Judas', 66: 'Åpenbaringen',
};

const bookSlugs: Record<number, string> = {
  1: '1mos', 2: '2mos', 3: '3mos', 4: '4mos', 5: '5mos',
  6: 'jos', 7: 'dom', 8: 'rut', 9: '1sam', 10: '2sam',
  11: '1kong', 12: '2kong', 13: '1kron', 14: '2kron',
  15: 'esr', 16: 'neh', 17: 'est', 18: 'job', 19: 'sal',
  20: 'ord', 21: 'fork', 22: 'hoy', 23: 'jes', 24: 'jer',
  25: 'klag', 26: 'esek', 27: 'dan', 28: 'hos', 29: 'joel',
  30: 'amos', 31: 'ob', 32: 'jona', 33: 'mika', 34: 'nah',
  35: 'hab', 36: 'sef', 37: 'hag', 38: 'sak', 39: 'mal',
  40: 'matt', 41: 'mark', 42: 'luk', 43: 'joh', 44: 'apg',
  45: 'rom', 46: '1kor', 47: '2kor', 48: 'gal', 49: 'ef',
  50: 'fil', 51: 'kol', 52: '1tess', 53: '2tess',
  54: '1tim', 55: '2tim', 56: 'tit', 57: 'filem', 58: 'hebr',
  59: 'jak', 60: '1pet', 61: '2pet', 62: '1joh', 63: '2joh',
  64: '3joh', 65: 'jud', 66: 'ap',
};

const bibleLabels: Record<string, string> = {
  osnb2: 'Bokmål',
  osnn1: 'Nynorsk',
  sblgnt: 'Gresk',
  tanach: 'Hebraisk',
};

interface GroupedChapters {
  [bookId: number]: {
    [bible: string]: number[];
  };
}

export function OfflinePage() {
  const [cachedChapters, setCachedChapters] = useState<CachedChapter[]>([]);
  const [supportingData, setSupportingData] = useState<SupportingDataStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());

  const loadCachedChapters = useCallback(async () => {
    try {
      // Add timeout to prevent hanging - resolve with empty array on timeout
      const timeoutPromise = new Promise<[]>((resolve) =>
        setTimeout(() => resolve([]), 5000)
      );

      const [chapters, supportingStatus] = await Promise.all([
        Promise.race([getAllCachedChapters(), timeoutPromise]),
        getSupportingDataStatus().catch(() => null),
      ]);

      const cached: CachedChapter[] = chapters.map(ch => ({
        bookId: ch.bookId,
        chapter: ch.chapter,
        bible: ch.bible,
      }));
      setCachedChapters(cached);
      setSupportingData(supportingStatus);
    } catch (error) {
      console.error('Failed to load cached chapters:', error);
      setCachedChapters([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCachedChapters();
  }, [loadCachedChapters]);

  // Group chapters by book and bible version
  const groupedChapters: GroupedChapters = {};
  for (const ch of cachedChapters) {
    if (!groupedChapters[ch.bookId]) {
      groupedChapters[ch.bookId] = {};
    }
    if (!groupedChapters[ch.bookId][ch.bible]) {
      groupedChapters[ch.bookId][ch.bible] = [];
    }
    groupedChapters[ch.bookId][ch.bible].push(ch.chapter);
  }

  // Sort chapters within each group
  for (const bookId of Object.keys(groupedChapters)) {
    for (const bible of Object.keys(groupedChapters[Number(bookId)])) {
      groupedChapters[Number(bookId)][bible].sort((a, b) => a - b);
    }
  }

  const sortedBookIds = Object.keys(groupedChapters).map(Number).sort((a, b) => a - b);

  function toggleBook(bookId: number) {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Offline' }
        ]} />

        <h1>Offline-tilgang</h1>

        <p className={styles.intro}>
          Kapitler du har lest blir automatisk lagret for offline-bruk.
          Du kan også laste ned hele bibelversjoner for å lese når du ikke har nett.
        </p>

        <div className={styles.grid}>
          <CacheStatus />
          <OfflineDownload onDownloadComplete={loadCachedChapters} />
        </div>

        {/* Supporting data section */}
        {supportingData && (supportingData.hasTimeline || supportingData.hasProphecies || supportingData.personsCount > 0 || supportingData.readingPlansCount > 0) && (
          <section className={styles.section}>
            <h2>Nedlastet støttedata</h2>
            <div className={styles.supportingDataGrid}>
              {supportingData.hasTimeline && (
                <Link to="/tidslinje" className={styles.supportingDataCard}>
                  <span className={styles.supportingDataIcon}>📅</span>
                  <span className={styles.supportingDataTitle}>Tidslinje</span>
                  <span className={styles.supportingDataDesc}>Bibelske hendelser</span>
                </Link>
              )}
              {supportingData.hasProphecies && (
                <Link to="/profetier" className={styles.supportingDataCard}>
                  <span className={styles.supportingDataIcon}>📜</span>
                  <span className={styles.supportingDataTitle}>Profetier</span>
                  <span className={styles.supportingDataDesc}>Profetier og oppfyllelser</span>
                </Link>
              )}
              {supportingData.personsCount > 0 && (
                <Link to="/personer" className={styles.supportingDataCard}>
                  <span className={styles.supportingDataIcon}>👤</span>
                  <span className={styles.supportingDataTitle}>Personer</span>
                  <span className={styles.supportingDataDesc}>{supportingData.personsCount} bibelske personer</span>
                </Link>
              )}
              {supportingData.readingPlansCount > 0 && (
                <Link to="/leseplan" className={styles.supportingDataCard}>
                  <span className={styles.supportingDataIcon}>📖</span>
                  <span className={styles.supportingDataTitle}>Leseplaner</span>
                  <span className={styles.supportingDataDesc}>{supportingData.readingPlansCount} leseplaner</span>
                </Link>
              )}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2>Nedlastede kapitler</h2>

          {isLoading ? (
            <p className={styles.loading}>Laster...</p>
          ) : sortedBookIds.length === 0 ? (
            <p className={styles.empty}>
              Ingen kapitler er lastet ned ennå. Besøk et kapittel for å lagre det offline,
              eller bruk nedlastingsfunksjonen over.
            </p>
          ) : (
            <div className={styles.bookList}>
              {sortedBookIds.map(bookId => {
                const bibles = groupedChapters[bookId];
                const isExpanded = expandedBooks.has(bookId);
                const totalChapters = Object.values(bibles).reduce((sum, chs) => sum + chs.length, 0);

                return (
                  <div key={bookId} className={styles.book}>
                    <button
                      className={styles.bookHeader}
                      onClick={() => toggleBook(bookId)}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.bookName}>
                        {bookNames[bookId] || `Bok ${bookId}`}
                      </span>
                      <span className={styles.chapterCount}>
                        {totalChapters} {totalChapters === 1 ? 'kapittel' : 'kapitler'}
                      </span>
                      <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                    </button>

                    {isExpanded && (
                      <div className={styles.bookContent}>
                        {Object.entries(bibles).map(([bible, chapters]) => (
                          <div key={bible} className={styles.bibleVersion}>
                            <span className={styles.bibleLabel}>
                              {bibleLabels[bible] || bible}:
                            </span>
                            <div className={styles.chapterLinks}>
                              {chapters.map(chapter => (
                                <Link
                                  key={chapter}
                                  to={`/${bookSlugs[bookId]}/${chapter}`}
                                  className={styles.chapterLink}
                                >
                                  {chapter}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
