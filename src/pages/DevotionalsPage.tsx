import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDevotionals } from '@/components/DevotionalsContext';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DevotionalCalendar } from '@/components/devotional/DevotionalCalendar';
import type { DevotionalType } from '@/types/devotional';
import { devotionalTypeLabels } from '@/types/devotional';
import { getCurrentContent, getLockedVersions, verseRefToReadable } from '@/lib/devotional-utils';
import styles from '@/styles/pages/devotionals.module.scss';

export function DevotionalsPage() {
  const { devotionals, loaded, searchDevotionals, getDevotionalsByType, getDevotionalsByTag, getAllTags } = useDevotionals();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DevotionalType | ''>('');
  const [filterTag, setFilterTag] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const allTags = getAllTags();

  const filtered = useMemo(() => {
    let result = devotionals;

    if (searchQuery.trim()) {
      result = searchDevotionals(searchQuery);
    }

    if (filterType) {
      const typeResults = getDevotionalsByType(filterType);
      result = result.filter(d => typeResults.some(t => t.id === d.id));
    }

    if (filterTag) {
      const tagResults = getDevotionalsByTag(filterTag);
      result = result.filter(d => tagResults.some(t => t.id === d.id));
    }

    // Sort by date descending
    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [devotionals, searchQuery, filterType, filterTag, searchDevotionals, getDevotionalsByType, getDevotionalsByTag]);

  if (!loaded) {
    return (
      <div className={styles.main}>
        <div className={styles.container}>
          <p className={styles.loading}>Laster manuskripter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Manuskripter' },
        ]} />

        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h1>Manuskripter</h1>
            <Link to="/manuskripter/ny" className={styles.newButton}>
              Nytt manuskript
            </Link>
          </div>
          <p className={styles.intro}>
            Skriv og organiser andakter, prekener, bibeltimer og studier.
          </p>
        </header>

        {devotionals.length === 0 ? (
          <div className={styles.empty}>
            <p>Du har ingen manuskripter ennå.</p>
            <Link to="/manuskripter/ny" className={styles.emptyButton}>Skriv ditt første manuskript</Link>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Søk..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Søk i manuskripter"
                />
                <select
                  className={styles.filterSelect}
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as DevotionalType | '')}
                  aria-label="Filtrer på type"
                >
                  <option value="">Alle typer</option>
                  {(Object.entries(devotionalTypeLabels) as [DevotionalType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {allTags.length > 0 && (
                  <select
                    className={styles.filterSelect}
                    value={filterTag}
                    onChange={e => setFilterTag(e.target.value)}
                    aria-label="Filtrer på emne"
                  >
                    <option value="">Alle emner</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Listevisning"
                >
                  Liste
                </button>
                <button
                  className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
                  onClick={() => setViewMode('calendar')}
                  aria-label="Kalendervisning"
                >
                  Kalender
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <DevotionalCalendar devotionals={filtered} />
            ) : filtered.length === 0 ? (
              <p className={styles.noResults}>Ingen manuskripter funnet.</p>
            ) : (
              <div className={styles.list}>
                {filtered.map(d => (
                  <Link key={d.id} to={`/manuskripter/${d.slug}`} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={`${styles.typeBadge} ${styles[`type_${d.type}`]}`}>
                        {devotionalTypeLabels[d.type]}
                      </span>
                      <span className={styles.cardDate}>
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className={styles.cardTitle}>
                      {d.title}
                      {getLockedVersions(d).length > 0 && (
                        <span className={styles.versionBadge}>
                          {getLockedVersions(d).length} {getLockedVersions(d).length === 1 ? 'versjon' : 'versjoner'}
                        </span>
                      )}
                    </h2>
                    {(d.tags.length > 0 || d.verses.length > 0) && (
                      <div className={styles.cardTags}>
                        {d.tags.map(tag => (
                          <span key={tag} className={styles.cardTag}>{tag}</span>
                        ))}
                        {d.verses.map(ref => (
                          <span key={ref} className={styles.cardVerse}>{verseRefToReadable(ref)}</span>
                        ))}
                      </div>
                    )}
                    <p className={styles.cardPreview}>
                      {(() => { const c = getCurrentContent(d); return c.replace(/\[(?:vers|ref):[^\]]+\]/g, '').substring(0, 150).trim() + (c.length > 150 ? '...' : ''); })()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
