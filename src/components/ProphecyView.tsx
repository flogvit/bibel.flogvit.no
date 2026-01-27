import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProphecyView.module.scss';
import type { ProphecyCategory, Prophecy, ProphecyReference, VerseWithOriginal, VerseRef } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import { VerseDisplay } from './bible/VerseDisplay';
import { ItemTagging } from './ItemTagging';

interface ProphecyViewProps {
  categories: ProphecyCategory[];
  prophecies: Prophecy[];
}

function getReferenceUrl(ref: ProphecyReference): string {
  return `/${toUrlSlug(ref.book_short_name || '')}/${ref.chapter}#v${ref.verse_start}`;
}

function toVerseRefs(ref: ProphecyReference): VerseRef {
  const verses: number[] = [];
  for (let v = ref.verse_start; v <= ref.verse_end; v++) {
    verses.push(v);
  }
  return {
    bookId: ref.book_id,
    chapter: ref.chapter,
    verses,
  };
}

interface LoadedVerses {
  [key: string]: VerseWithOriginal[];
}

export function ProphecyView({ categories, prophecies }: ProphecyViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedProphecy, setExpandedProphecy] = useState<string | null>(null);
  const [showVerses, setShowVerses] = useState<{ [prophecyId: string]: boolean }>({});
  const [loadedVerses, setLoadedVerses] = useState<LoadedVerses>({});
  const [loadingVerses, setLoadingVerses] = useState<{ [prophecyId: string]: boolean }>({});

  const filteredProphecies = selectedCategory
    ? prophecies.filter(p => p.category_id === selectedCategory)
    : prophecies;

  const handleToggleVerses = async (prophecy: Prophecy) => {
    const prophecyId = prophecy.id;

    setShowVerses(prev => ({ ...prev, [prophecyId]: !prev[prophecyId] }));

    if (loadedVerses[prophecyId]) {
      return;
    }

    setLoadingVerses(prev => ({ ...prev, [prophecyId]: true }));

    try {
      // Collect all refs: prophecy + fulfillments
      const refs: VerseRef[] = [
        toVerseRefs(prophecy.prophecy),
        ...prophecy.fulfillments.map(f => toVerseRefs(f))
      ];

      const response = await fetch('/api/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs }),
      });

      if (!response.ok) throw new Error('Failed to fetch verses');

      const verses: VerseWithOriginal[] = await response.json();
      setLoadedVerses(prev => ({ ...prev, [prophecyId]: verses }));
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoadingVerses(prev => ({ ...prev, [prophecyId]: false }));
    }
  };

  // Group verses by reference for display
  const getVersesForRef = (prophecyId: string, ref: ProphecyReference): VerseWithOriginal[] => {
    const verses = loadedVerses[prophecyId];
    if (!verses) return [];
    return verses.filter(v =>
      v.verse.book_id === ref.book_id &&
      v.verse.chapter === ref.chapter &&
      v.verse.verse >= ref.verse_start &&
      v.verse.verse <= ref.verse_end
    );
  };

  return (
    <div className={styles.container}>
      {/* Category filter */}
      <div className={styles.categoryFilter}>
        <button
          className={`${styles.categoryButton} ${!selectedCategory ? styles.active : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          Alle kategorier
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <p className={styles.filterInfo}>
        Viser {filteredProphecies.length} profetier
        {selectedCategory && ` i kategorien "${categories.find(c => c.id === selectedCategory)?.name}"`}
      </p>

      {/* Prophecies list */}
      <div className={styles.prophecyList}>
        {filteredProphecies.map((prophecy, index) => {
          const isExpanded = expandedProphecy === prophecy.id;
          const prevProphecy = filteredProphecies[index - 1];
          const showCategoryHeader = !selectedCategory && (!prevProphecy || prevProphecy.category_id !== prophecy.category_id);
          const category = categories.find(c => c.id === prophecy.category_id);
          const isShowingVerses = showVerses[prophecy.id];
          const isLoadingVerses = loadingVerses[prophecy.id];

          return (
            <div key={prophecy.id}>
              {showCategoryHeader && category && (
                <div className={styles.categoryHeader}>
                  <h2>{category.name}</h2>
                  {category.description && <p>{category.description}</p>}
                </div>
              )}

              <div className={`${styles.prophecy} ${isExpanded ? styles.expanded : ''}`}>
                <div
                  className={styles.prophecyHeader}
                  onClick={() => setExpandedProphecy(isExpanded ? null : prophecy.id)}
                >
                  <h3 className={styles.prophecyTitle}>{prophecy.title}</h3>
                  <div className={styles.prophecyRefs}>
                    <span className={styles.prophecyRef}>
                      <span className={styles.refLabel}>Profeti:</span>
                      <Link
                        to={getReferenceUrl(prophecy.prophecy)}
                        className={styles.refLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {prophecy.prophecy.reference}
                      </Link>
                    </span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.fulfillmentRef}>
                      <span className={styles.refLabel}>
                        {prophecy.category_id === 'endtimes' ? 'NT-referanse:' : 'Oppfylt:'}
                      </span>
                      {prophecy.fulfillments.map((f, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          <Link
                            to={getReferenceUrl(f)}
                            className={styles.refLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {f.reference}
                          </Link>
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.prophecyContent}>
                    {prophecy.explanation && (
                      <p className={styles.explanation}>{prophecy.explanation}</p>
                    )}

                    <div className={styles.taggingSection}>
                      <ItemTagging itemType="prophecy" itemId={prophecy.id} />
                    </div>

                    <div className={styles.versesSection}>
                      <button
                        className={styles.showVersesButton}
                        onClick={() => handleToggleVerses(prophecy)}
                      >
                        {isShowingVerses ? 'Skjul bibelvers' : 'Vis bibelvers'}
                      </button>

                      {isLoadingVerses && (
                        <p className={styles.loadingVerses}>Laster bibelvers...</p>
                      )}

                      {isShowingVerses && loadedVerses[prophecy.id] && (
                        <div className={styles.inlineVerses}>
                          {/* Prophecy verses */}
                          <div className={styles.verseSection}>
                            <h4 className={styles.verseSectionTitle}>
                              Profetien ({prophecy.prophecy.reference})
                            </h4>
                            {getVersesForRef(prophecy.id, prophecy.prophecy).map((verseData, verseIndex) => (
                              <div key={verseIndex} className={styles.verseGroup}>
                                <div className={styles.verseHeader}>
                                  <Link
                                    to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                                    className={styles.verseRef}
                                  >
                                    {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                                  </Link>
                                </div>
                                <VerseDisplay
                                  verse={verseData.verse}
                                  bookId={verseData.verse.book_id}
                                  originalText={verseData.originalText || undefined}
                                  originalLanguage={verseData.originalLanguage}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Fulfillment verses */}
                          {prophecy.fulfillments.map((fulfillment, fIndex) => (
                            <div key={fIndex} className={styles.verseSection}>
                              <h4 className={styles.verseSectionTitle}>
                                {prophecy.category_id === 'endtimes' ? 'NT-referanse' : 'Oppfyllelse'} ({fulfillment.reference})
                              </h4>
                              {getVersesForRef(prophecy.id, fulfillment).map((verseData, verseIndex) => (
                                <div key={verseIndex} className={styles.verseGroup}>
                                  <div className={styles.verseHeader}>
                                    <Link
                                      to={`/${toUrlSlug(verseData.bookShortName)}/${verseData.verse.chapter}#v${verseData.verse.verse}`}
                                      className={styles.verseRef}
                                    >
                                      {verseData.bookShortName} {verseData.verse.chapter}:{verseData.verse.verse}
                                    </Link>
                                  </div>
                                  <VerseDisplay
                                    verse={verseData.verse}
                                    bookId={verseData.verse.book_id}
                                    originalText={verseData.originalText || undefined}
                                    originalLanguage={verseData.originalLanguage}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isExpanded && (
                  <span className={styles.expandHint}>Klikk for mer info</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
