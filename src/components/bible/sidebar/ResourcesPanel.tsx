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
  const [results, setResults] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [autoSearchKey, setAutoSearchKey] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setLoading(true);
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
      if (data.words) data.words.forEach((w: any) => items.push({
        type: 'word', id: `${w.word}-${w.book_id}-${w.chapter}`, title: w.word, subtitle: w.explanation?.substring(0, 80),
      }));
      if (data.numberSymbolism) data.numberSymbolism.forEach((n: any) => items.push({
        type: 'number', id: n.number, title: `${n.number}`, subtitle: n.title, url: `/tallsymbolikk/${n.number}`,
      }));
      if (data.days) data.days.forEach((d: any) => items.push({
        type: 'day', id: d.id, title: d.name, url: `/dager/${d.id}`,
      }));

      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search with book name when chapter changes
  useEffect(() => {
    const key = `${bookName}-${chapter}`;
    if (autoSearchKey === key) return;
    setAutoSearchKey(key);
    performSearch(bookName);
  }, [bookName, chapter, autoSearchKey, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleExpand = async (item: ResourceItem) => {
    const key = `${item.type}-${item.id}`;
    if (expandedId === key) {
      setExpandedId(null);
      return;
    }
    setExpandedId(key);

    if (!details[key]) {
      try {
        let description = '';
        if (item.type === 'person') {
          const res = await fetch(`/api/persons/${item.id}`);
          const data = await res.json();
          description = data.summary || '';
        } else if (item.type === 'prophecy') {
          const res = await fetch('/api/prophecies');
          const data = await res.json();
          const prophecy = data.prophecies?.find((p: any) => p.id === item.id);
          description = prophecy?.explanation || '';
        }
        setDetails(prev => ({ ...prev, [key]: description }));
      } catch {
        setDetails(prev => ({ ...prev, [key]: '' }));
      }
    }
  };

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

      {loading && results.length === 0 && (
        <div className={styles.loading}>Søker...</div>
      )}

      <div className={styles.results}>
        {Object.entries(groupedResults).map(([type, items]) => (
          <div key={type} className={styles.group}>
            <h3 className={styles.groupTitle}>{typeLabels[type] || type}</h3>
            {items.map(item => {
              const key = `${item.type}-${item.id}`;
              const isExpanded = expandedId === key;
              const detail = details[key];

              return (
                <div key={key} className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}>
                  <div className={styles.itemHeader} onClick={() => handleExpand(item)}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
                  </div>
                  {isExpanded && (
                    <div className={styles.itemDetail}>
                      {detail && <p className={styles.description}>{detail}</p>}
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

        {!loading && results.length === 0 && autoSearchKey && (
          <div className={styles.empty}>Ingen ressurser funnet. Prøv å søke med andre ord.</div>
        )}
      </div>
    </div>
  );
}
