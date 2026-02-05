import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import styles from '@/styles/pages/statistics.module.scss';

interface BookStatistics {
  bookId: number;
  bookName: string;
  shortName: string;
  testament: string;
  chapters: number;
  verses: number;
  words: number;
  originalWords: number;
  originalLanguage: 'hebrew' | 'greek';
}

interface BibleStatistics {
  totalBooks: number;
  totalChapters: number;
  totalVerses: number;
  totalWords: number;
  totalOriginalWords: number;
  otBooks: number;
  otChapters: number;
  otVerses: number;
  otWords: number;
  ntBooks: number;
  ntChapters: number;
  ntVerses: number;
  ntWords: number;
  books: BookStatistics[];
}

interface WordFrequency {
  word: string;
  count: number;
}

type WordTab = 'norwegian' | 'hebrew' | 'greek';
type SortColumn = 'bookName' | 'chapters' | 'verses' | 'words' | 'originalWords';
type SortDirection = 'asc' | 'desc';

export function StatisticsPage() {
  const [stats, setStats] = useState<BibleStatistics | null>(null);
  const [topWords, setTopWords] = useState<WordFrequency[]>([]);
  const [wordTab, setWordTab] = useState<WordTab>('norwegian');
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false);
  const [wordFilter, setWordFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [includeStopWords, setIncludeStopWords] = useState(false);

  useEffect(() => {
    fetch('/api/statistics')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading statistics:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setWordsLoading(true);
    let endpoint = wordTab === 'norwegian'
      ? '/api/statistics/top-words'
      : `/api/statistics/top-words/${wordTab}`;

    // Add query params
    const params = new URLSearchParams();
    if (wordTab === 'norwegian' && includeStopWords) {
      params.set('all', 'true');
    }
    // Fetch more words to allow filtering
    params.set('limit', '500');
    endpoint += '?' + params.toString();

    fetch(endpoint, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setTopWords(data.words);
        setWordsLoading(false);
      })
      .catch(err => {
        console.error('Error loading top words:', err);
        setWordsLoading(false);
      });
  }, [wordTab, includeStopWords]);

  const formatNumber = (n: number) => n.toLocaleString('nb-NO');

  // Filter words based on search
  const filteredWords = useMemo(() => {
    if (!wordFilter.trim()) return topWords;
    const filter = wordFilter.toLowerCase();
    return topWords.filter(w => w.word.toLowerCase().includes(filter));
  }, [topWords, wordFilter]);

  // Get words to display (limited or all)
  const displayWords = showAllWords ? filteredWords : filteredWords.slice(0, 50);

  // Get search URL for a word
  const getWordSearchUrl = (word: string) => {
    if (wordTab === 'norwegian') {
      return `/sok?q=${encodeURIComponent(word)}`;
    }
    // Original language search
    return `/sok/original?q=${encodeURIComponent(word)}`;
  };

  // Reset filter and expanded view when changing tabs
  useEffect(() => {
    setShowAllWords(false);
    setWordFilter('');
  }, [wordTab]);

  if (loading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <div className={styles.loading}>Laster statistikk...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <p>Kunne ikke laste statistikk.</p>
        </div>
      </div>
    );
  }

  // Handle column header click for sorting
  // Cycles through: default → desc → asc → default (for numbers)
  // Or: default → asc → desc → default (for text)
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Same column - cycle through states
      if (column === 'bookName') {
        // Text: asc → desc → null
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else {
          setSortColumn(null);
        }
      } else {
        // Numbers: desc → asc → null
        if (sortDirection === 'desc') {
          setSortDirection('asc');
        } else {
          setSortColumn(null);
        }
      }
    } else {
      // New column, default to descending for numbers, ascending for text
      setSortColumn(column);
      setSortDirection(column === 'bookName' ? 'asc' : 'desc');
    }
  };

  // Sort books
  const sortBooks = (books: BookStatistics[]) => {
    if (!sortColumn) return books;

    return [...books].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'bookName') {
        comparison = a.bookName.localeCompare(b.bookName, 'nb');
      } else {
        comparison = a[sortColumn] - b[sortColumn];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const otBooks = sortBooks(stats.books.filter(b => b.testament === 'OT'));
  const ntBooks = sortBooks(stats.books.filter(b => b.testament === 'NT'));

  // Get sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Statistikk' }
        ]} />

        <h1>Bibelstatistikk</h1>

        <section className={styles.section}>
          <h2>Oversikt</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(stats.totalBooks)}</div>
              <div className={styles.statLabel}>Bøker</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(stats.totalChapters)}</div>
              <div className={styles.statLabel}>Kapitler</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(stats.totalVerses)}</div>
              <div className={styles.statLabel}>Vers</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(stats.totalWords)}</div>
              <div className={styles.statLabel}>Ord (norsk)</div>
            </div>
          </div>

          <div className={styles.comparison}>
            <div className={styles.comparisonCard}>
              <h3>Det gamle testamente</h3>
              <div className={styles.comparisonStats}>
                <div className={styles.comparisonRow}>
                  <span>Bøker</span>
                  <span>{formatNumber(stats.otBooks)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Kapitler</span>
                  <span>{formatNumber(stats.otChapters)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Vers</span>
                  <span>{formatNumber(stats.otVerses)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Ord</span>
                  <span>{formatNumber(stats.otWords)}</span>
                </div>
              </div>
            </div>
            <div className={styles.comparisonCard}>
              <h3>Det nye testamente</h3>
              <div className={styles.comparisonStats}>
                <div className={styles.comparisonRow}>
                  <span>Bøker</span>
                  <span>{formatNumber(stats.ntBooks)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Kapitler</span>
                  <span>{formatNumber(stats.ntChapters)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Vers</span>
                  <span>{formatNumber(stats.ntVerses)}</span>
                </div>
                <div className={styles.comparisonRow}>
                  <span>Ord</span>
                  <span>{formatNumber(stats.ntWords)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Vanligste ord</h2>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${wordTab === 'norwegian' ? styles.active : ''}`}
              onClick={() => setWordTab('norwegian')}
            >
              Norsk
            </button>
            <button
              className={`${styles.tab} ${wordTab === 'hebrew' ? styles.active : ''}`}
              onClick={() => setWordTab('hebrew')}
            >
              Hebraisk (GT)
            </button>
            <button
              className={`${styles.tab} ${wordTab === 'greek' ? styles.active : ''}`}
              onClick={() => setWordTab('greek')}
            >
              Gresk (NT)
            </button>
          </div>

          {wordTab === 'norwegian' && (
            <label className={styles.stopWordsToggle}>
              <input
                type="checkbox"
                checked={includeStopWords}
                onChange={(e) => setIncludeStopWords(e.target.checked)}
              />
              <span>Inkluder vanlige ord (og, i, til, om, ...)</span>
            </label>
          )}

          {wordsLoading ? (
            <div className={styles.loading}>Laster ord...</div>
          ) : (
            <>
              <div className={styles.wordFilterContainer}>
                <input
                  type="text"
                  value={wordFilter}
                  onChange={(e) => setWordFilter(e.target.value)}
                  placeholder="Søk blant ord..."
                  className={styles.wordFilterInput}
                />
                {wordFilter && (
                  <span className={styles.filterCount}>
                    {filteredWords.length} av {topWords.length} ord
                  </span>
                )}
              </div>
              <div className={`${styles.wordList} ${showAllWords ? styles.expanded : ''}`}>
                {displayWords.map((item, i) => (
                  <Link
                    key={i}
                    to={getWordSearchUrl(item.word)}
                    className={styles.wordChip}
                    title={`Søk etter "${item.word}"`}
                  >
                    <span className={`${styles.wordText} ${wordTab !== 'norwegian' ? styles.originalWord : ''}`}>
                      {item.word}
                    </span>
                    <span className={styles.wordCount}>{formatNumber(item.count)}</span>
                  </Link>
                ))}
              </div>
              {!showAllWords && topWords.length > 50 && (
                <button
                  className={styles.showAllButton}
                  onClick={() => setShowAllWords(true)}
                >
                  Vis alle {topWords.length} ord
                </button>
              )}
              {showAllWords && (
                <button
                  className={styles.showAllButton}
                  onClick={() => {
                    setShowAllWords(false);
                    setWordFilter('');
                  }}
                >
                  Vis færre
                </button>
              )}
            </>
          )}
        </section>

        <section className={styles.section}>
          <h2>Per bok</h2>
          <table className={styles.booksTable}>
            <thead>
              <tr>
                <th
                  className={`${styles.sortable} ${sortColumn === 'bookName' ? styles.sorted : ''}`}
                  onClick={() => handleSort('bookName')}
                >
                  Bok{getSortIndicator('bookName')}
                </th>
                <th
                  className={`${styles.numberCell} ${styles.sortable} ${sortColumn === 'chapters' ? styles.sorted : ''}`}
                  onClick={() => handleSort('chapters')}
                >
                  Kapitler{getSortIndicator('chapters')}
                </th>
                <th
                  className={`${styles.numberCell} ${styles.sortable} ${sortColumn === 'verses' ? styles.sorted : ''}`}
                  onClick={() => handleSort('verses')}
                >
                  Vers{getSortIndicator('verses')}
                </th>
                <th
                  className={`${styles.numberCell} ${styles.sortable} ${sortColumn === 'words' ? styles.sorted : ''}`}
                  onClick={() => handleSort('words')}
                >
                  Ord (NO){getSortIndicator('words')}
                </th>
                <th
                  className={`${styles.numberCell} ${styles.sortable} ${sortColumn === 'originalWords' ? styles.sorted : ''}`}
                  onClick={() => handleSort('originalWords')}
                >
                  Ord (original){getSortIndicator('originalWords')}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.testamentHeader}>
                <td colSpan={5}>Det gamle testamente</td>
              </tr>
              {otBooks.map(book => (
                <tr key={book.bookId}>
                  <td>{book.bookName}</td>
                  <td className={styles.numberCell}>{formatNumber(book.chapters)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.verses)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.words)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.originalWords)}</td>
                </tr>
              ))}
              <tr className={styles.testamentHeader}>
                <td colSpan={5}>Det nye testamente</td>
              </tr>
              {ntBooks.map(book => (
                <tr key={book.bookId}>
                  <td>{book.bookName}</td>
                  <td className={styles.numberCell}>{formatNumber(book.chapters)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.verses)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.words)}</td>
                  <td className={styles.numberCell}>{formatNumber(book.originalWords)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
