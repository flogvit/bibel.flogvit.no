import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './ResourcesPanel.module.scss';

interface ResourcesPanelProps {
  bookId: number;
  chapter: number;
  bookName: string;
}

interface ResourceItem {
  type: string;
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
}

const typeLabels: Record<string, string> = {
  person: 'Personer',
  prophecy: 'Profetier',
  theme: 'Temaer',
  parallel: 'Paralleller',
  story: 'Fortellinger',
  timeline: 'Tidslinje',
  word: 'Viktige ord',
  number: 'Tallsymbolikk',
  day: 'Dager',
};

export function ResourcesPanel({ bookId, chapter, bookName }: ResourcesPanelProps) {
  const [query, setQuery] = useState('');
  const [chapterResults, setChapterResults] = useState<ResourceItem[]>([]);
  const [searchResults, setSearchResults] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Auto-load resources for current chapter
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIsSearchMode(false);
    setExpandedId(null);

    fetch(`/api/search/chapter-resources?bookId=${bookId}&chapter=${chapter}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const items: ResourceItem[] = [];
        if (data.persons) data.persons.forEach((p: any) => items.push({
          type: 'person', id: p.id, title: p.name, subtitle: p.title || p.era,
          description: p.summary, url: `/personer/${p.id}`,
        }));
        if (data.prophecies) data.prophecies.forEach((p: any) => items.push({
          type: 'prophecy', id: p.id, title: p.title, subtitle: p.category_name,
          description: p.explanation,
        }));
        setChapterResults(items);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setChapterResults([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [bookId, chapter]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setLoading(true);
    setIsSearchMode(true);
    try {
      const res = await fetch(`/api/search/all?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      const items: ResourceItem[] = [];
      if (data.persons) data.persons.forEach((p: any) => items.push({
        type: 'person', id: p.id, title: p.name, subtitle: p.title || p.era, url: `/personer/${p.id}`,
      }));
      if (data.prophecies) data.prophecies.forEach((p: any) => items.push({
        type: 'prophecy', id: p.id, title: p.title, subtitle: p.category_name,
      }));
      if (data.themes) data.themes.forEach((t: any) => items.push({
        type: 'theme', id: t.id, title: t.name, url: `/temaer/${t.id}`,
      }));
      if (data.parallels) data.parallels.forEach((p: any) => items.push({
        type: 'parallel', id: p.id, title: p.title, url: `/paralleller/${p.id}`,
      }));
      if (data.stories) data.stories.forEach((s: any) => items.push({
        type: 'story', id: s.id, title: s.title, subtitle: s.category, url: `/fortellinger/${s.slug}`,
      }));
      if (data.timeline) data.timeline.forEach((t: any) => items.push({
        type: 'timeline', id: t.id, title: t.title, subtitle: t.year_display,
      }));

      setSearchResults(items);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
  };

  const results = isSearchMode ? searchResults : chapterResults;

  // Group results by type for display
  const groupedResults = results.reduce<Record<string, ResourceItem[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className={styles.panel}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Søk i ressurser..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? '...' : 'Søk'}
        </button>
      </form>

      {isSearchMode && (
        <button className={styles.clearSearch} onClick={handleClearSearch}>
          ← Vis ressurser for dette kapittelet
        </button>
      )}

      {loading && results.length === 0 && (
        <div className={styles.loading}>Laster...</div>
      )}

      <div className={styles.results}>
        {Object.entries(groupedResults).map(([type, items]) => (
          <div key={type} className={styles.group}>
            <h3 className={styles.groupTitle}>{typeLabels[type] || type}</h3>
            {items.map(item => {
              const key = `${item.type}-${item.id}`;
              const isExpanded = expandedId === key;

              return (
                <div key={key} className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}>
                  <div className={styles.itemHeader} onClick={() => setExpandedId(isExpanded ? null : key)}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
                  </div>
                  {isExpanded && (
                    <div className={styles.itemDetail}>
                      {item.description && <p className={styles.description}>{item.description}</p>}
                      {item.url && (
                        <Link to={item.url} className={styles.detailLink}>
                          Les mer →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div className={styles.empty}>
            {isSearchMode
              ? 'Ingen resultater funnet. Prøv andre søkeord.'
              : 'Ingen ressurser knyttet til dette kapittelet.'}
          </div>
        )}
      </div>
    </div>
  );
}
