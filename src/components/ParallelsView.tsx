import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ParallelsView.module.scss';
import type { GospelParallelSection, GospelParallel, GospelParallelPassage } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';

interface ParallelsViewProps {
  sections: GospelParallelSection[];
  parallels: GospelParallel[];
}

type Gospel = 'matthew' | 'mark' | 'luke' | 'john';

const GOSPELS: Gospel[] = ['matthew', 'mark', 'luke', 'john'];

const GOSPEL_NAMES: Record<Gospel, string> = {
  matthew: 'Matteus',
  mark: 'Markus',
  luke: 'Lukas',
  john: 'Johannes'
};

const GOSPEL_COLORS: Record<Gospel, string> = {
  matthew: 'blue',
  mark: 'green',
  luke: 'orange',
  john: 'purple'
};

interface LoadedVerses {
  [parallelId: string]: Record<string, Array<{ verse: number; text: string }>>;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

function getPassageUrl(passage: GospelParallelPassage): string {
  return `/${toUrlSlug(passage.book_short_name || '')}/${passage.chapter}#v${passage.verse_start}`;
}

interface GospelColumnProps {
  gospel: Gospel;
  passage: GospelParallelPassage | undefined;
  verses: Array<{ verse: number; text: string }> | undefined;
  isLoading: boolean;
}

function GospelColumn({ gospel, passage, verses, isLoading }: GospelColumnProps) {
  if (!passage) {
    return (
      <div className={`${styles.gospelColumn} ${styles[GOSPEL_COLORS[gospel]]}`}>
        <div className={styles.columnHeader}>
          <span className={styles.gospelBadge}>{GOSPEL_NAMES[gospel]}</span>
        </div>
        <div className={styles.noPassage}>
          Ikke i {GOSPEL_NAMES[gospel]}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.gospelColumn} ${styles[GOSPEL_COLORS[gospel]]}`}>
      <div className={styles.columnHeader}>
        <span className={styles.gospelBadge}>{GOSPEL_NAMES[gospel]}</span>
        <Link to={getPassageUrl(passage)} className={styles.referenceLink}>
          {passage.reference}
        </Link>
      </div>
      <div className={styles.versesContent}>
        {isLoading && <p className={styles.loading}>Laster...</p>}
        {!isLoading && verses && verses.map(v => (
          <p key={v.verse} className={styles.verse}>
            <span className={styles.verseNum}>{v.verse}</span>
            {v.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function ParallelsView({ sections, parallels }: ParallelsViewProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedParallel, setExpandedParallel] = useState<string | null>(null);
  const [loadedVerses, setLoadedVerses] = useState<LoadedVerses>({});
  const [loadingVerses, setLoadingVerses] = useState<{ [parallelId: string]: boolean }>({});
  const [mobileGospel, setMobileGospel] = useState<Gospel>('matthew');
  const isMobile = useIsMobile();

  const filteredParallels = selectedSection
    ? parallels.filter(p => p.section_id === selectedSection)
    : parallels;

  const handleExpand = async (parallel: GospelParallel) => {
    const parallelId = parallel.id;

    if (expandedParallel === parallelId) {
      setExpandedParallel(null);
      return;
    }

    setExpandedParallel(parallelId);

    if (loadedVerses[parallelId]) {
      return;
    }

    setLoadingVerses(prev => ({ ...prev, [parallelId]: true }));

    try {
      const response = await fetch(`/api/parallels/${parallelId}/verses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bible: 'osnb2' }),
      });

      if (!response.ok) throw new Error('Failed to fetch verses');

      const data = await response.json();
      setLoadedVerses(prev => ({ ...prev, [parallelId]: data.verses }));
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoadingVerses(prev => ({ ...prev, [parallelId]: false }));
    }
  };

  const getGospelsInParallel = (parallel: GospelParallel): Gospel[] => {
    if (!parallel.passages) return [];
    return GOSPELS.filter(g => parallel.passages![g]);
  };

  return (
    <div className={styles.container}>
      {/* Section filter */}
      <div className={styles.sectionFilter}>
        <button
          className={`${styles.sectionButton} ${!selectedSection ? styles.active : ''}`}
          onClick={() => setSelectedSection(null)}
        >
          Alle seksjoner
        </button>
        {sections.map(section => (
          <button
            key={section.id}
            className={`${styles.sectionButton} ${selectedSection === section.id ? styles.active : ''}`}
            onClick={() => setSelectedSection(section.id)}
            title={section.description || undefined}
          >
            {section.name}
          </button>
        ))}
      </div>

      <p className={styles.filterInfo}>
        Viser {filteredParallels.length} paralleller
        {selectedSection && ` i seksjonen "${sections.find(s => s.id === selectedSection)?.name}"`}
      </p>

      {/* Parallels list */}
      <div className={styles.parallelList}>
        {filteredParallels.map((parallel, index) => {
          const isExpanded = expandedParallel === parallel.id;
          const prevParallel = filteredParallels[index - 1];
          const showSectionHeader = !selectedSection && (!prevParallel || prevParallel.section_id !== parallel.section_id);
          const section = sections.find(s => s.id === parallel.section_id);
          const isLoading = loadingVerses[parallel.id];
          const verses = loadedVerses[parallel.id];
          const gospelsInParallel = getGospelsInParallel(parallel);

          return (
            <div key={parallel.id}>
              {showSectionHeader && section && (
                <div className={styles.sectionHeader}>
                  <h2>{section.name}</h2>
                  {section.description && <p>{section.description}</p>}
                </div>
              )}

              <div className={`${styles.parallel} ${isExpanded ? styles.expanded : ''}`}>
                <div
                  className={styles.parallelHeader}
                  onClick={() => handleExpand(parallel)}
                >
                  <h3 className={styles.parallelTitle}>{parallel.title}</h3>
                  <div className={styles.gospelBadges}>
                    {gospelsInParallel.map(gospel => (
                      <span
                        key={gospel}
                        className={`${styles.badge} ${styles[GOSPEL_COLORS[gospel]]}`}
                      >
                        {GOSPEL_NAMES[gospel].charAt(0)}
                      </span>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.parallelContent}>
                    {parallel.notes && (
                      <p className={styles.notes}>{parallel.notes}</p>
                    )}

                    {isMobile ? (
                      /* Mobile: Tabs */
                      <div className={styles.mobileTabs}>
                        <div className={styles.tabButtons}>
                          {gospelsInParallel.map(gospel => (
                            <button
                              key={gospel}
                              className={`${styles.tabButton} ${styles[GOSPEL_COLORS[gospel]]} ${mobileGospel === gospel ? styles.active : ''}`}
                              onClick={() => setMobileGospel(gospel)}
                            >
                              {GOSPEL_NAMES[gospel]}
                            </button>
                          ))}
                        </div>
                        <div className={styles.tabContent}>
                          <GospelColumn
                            gospel={mobileGospel}
                            passage={parallel.passages?.[mobileGospel]}
                            verses={verses?.[mobileGospel]}
                            isLoading={isLoading}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Desktop: Side by side columns */
                      <div className={styles.columnsGrid} style={{ gridTemplateColumns: `repeat(${gospelsInParallel.length}, 1fr)` }}>
                        {gospelsInParallel.map(g => (
                          <GospelColumn
                            key={g}
                            gospel={g}
                            passage={parallel.passages?.[g]}
                            verses={verses?.[g]}
                            isLoading={isLoading}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!isExpanded && (
                  <span className={styles.expandHint}>Klikk for å se tekstene</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
