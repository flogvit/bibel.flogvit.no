import { useState, useRef } from 'react';
import styles from './ResourceSearchPanel.module.scss';

interface PersonResult {
  id: string;
  name: string;
  title: string;
  era: string;
  summary: string;
  roles: string[];
}

interface ProphecyResult {
  id: string;
  title: string;
  explanation: string | null;
  category_name: string;
  prophecy_ref: string;
}

interface ThemeResult {
  id: number;
  name: string;
}

interface ParallelResult {
  id: string;
  title: string;
  notes: string | null;
  section_name: string;
}

interface StoryResult {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  category: string;
}

interface TimelineResult {
  id: string;
  title: string;
  description: string | null;
  year_display: string | null;
  timeline_type: string;
}

interface WordResult {
  word: string;
  explanation: string;
  book_short_name: string;
  book_name_no: string;
  chapter: number;
}

interface SearchResults {
  persons: PersonResult[];
  prophecies: ProphecyResult[];
  themes: ThemeResult[];
  parallels: ParallelResult[];
  stories: StoryResult[];
  timeline: TimelineResult[];
  words: WordResult[];
}

interface ResourceSearchPanelProps {
  onInsert: (text: string) => void;
}

interface GroupProps<T> {
  label: string;
  count: number;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

interface DetailPart {
  text: string;
  label: string;
  ref?: string;
}

function ResultGroup<T>({ label, count, items, renderItem }: GroupProps<T>) {
  const [collapsed, setCollapsed] = useState(false);

  if (count === 0) return null;

  return (
    <div className={styles.group}>
      <button className={styles.groupHeader} onClick={() => setCollapsed(!collapsed)}>
        <span className={styles.groupLabel}>{label}</span>
        <span className={styles.groupCount}>{count}</span>
        <span className={styles.groupToggle}>{collapsed ? '+' : '\u2212'}</span>
      </button>
      {!collapsed && (
        <div className={styles.groupItems}>
          {items.map((item, i) => renderItem(item, i))}
        </div>
      )}
    </div>
  );
}

export function ResourceSearchPanel({ onInsert }: ResourceSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedItem, setExpandedItem] = useState<{ type: string; id: string } | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const propheciesCacheRef = useRef<any[] | null>(null);

  async function doSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;

    setIsLoading(true);
    setHasSearched(true);
    setExpandedItem(null);
    setSelectedParts(new Set());
    try {
      const res = await fetch(`/api/search/all?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    }
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch(query);
  }

  function isExpanded(type: string, id: string) {
    return expandedItem?.type === type && expandedItem?.id === id;
  }

  async function handleExpand(type: string, id: string) {
    if (isExpanded(type, id)) {
      setExpandedItem(null);
      setSelectedParts(new Set());
      return;
    }
    setExpandedItem({ type, id });
    setSelectedParts(new Set());

    const cacheKey = `${type}:${id}`;
    if (!detailCache[cacheKey]) {
      setLoadingDetail(true);
      try {
        const data = await fetchDetailData(type, id);
        if (data) setDetailCache(prev => ({ ...prev, [cacheKey]: data }));
      } catch { /* ignore */ }
      setLoadingDetail(false);
    }
  }

  async function fetchDetailData(type: string, id: string) {
    switch (type) {
      case 'person': {
        const res = await fetch(`/api/persons/${id}`);
        return res.json();
      }
      case 'prophecy': {
        if (!propheciesCacheRef.current) {
          const res = await fetch('/api/prophecies');
          const data = await res.json();
          propheciesCacheRef.current = data.prophecies || [];
        }
        return propheciesCacheRef.current?.find((p: any) => p.id === id) || null;
      }
      case 'theme': {
        const res = await fetch(`/api/themes/${id}`);
        const data = await res.json();
        if (data?.content) {
          data.parsedContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        }
        return data;
      }
      case 'parallel': {
        const res = await fetch(`/api/parallels/${id}`);
        return res.json();
      }
      case 'story': {
        const res = await fetch(`/api/stories/${id}`);
        return res.json();
      }
      default:
        return null;
    }
  }

  function togglePart(index: number) {
    setSelectedParts(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function getDetailParts(type: string, id: string): DetailPart[] {
    const data = detailCache[`${type}:${id}`];
    if (!data) return [];

    switch (type) {
      case 'person': {
        const parts: DetailPart[] = [];
        if (data.summary) parts.push({ text: data.summary, label: 'Sammendrag' });
        for (const evt of (data.keyEvents || [])) {
          parts.push({ text: `${evt.title}: ${evt.description}`, label: evt.title });
        }
        return parts;
      }
      case 'prophecy': {
        const parts: DetailPart[] = [];
        if (data.explanation) parts.push({ text: data.explanation, label: 'Forklaring' });
        if (data.prophecy?.reference) {
          parts.push({ text: `Profeti: ${data.prophecy.reference}`, label: 'Profeti-ref', ref: data.prophecy.reference });
        }
        for (const f of (data.fulfillments || [])) {
          if (f.reference) {
            parts.push({ text: `Oppfyllelse: ${f.reference}`, label: f.reference, ref: f.reference });
          }
        }
        return parts;
      }
      case 'theme': {
        const content = data.parsedContent || {};
        const parts: DetailPart[] = [];
        if (content.introduction) parts.push({ text: content.introduction, label: 'Introduksjon' });
        for (const sec of (content.sections || [])) {
          const text = sec.description ? `${sec.title}: ${sec.description}` : sec.title;
          parts.push({ text, label: sec.title });
        }
        return parts;
      }
      case 'parallel': {
        const parts: DetailPart[] = [];
        if (data.notes) parts.push({ text: data.notes, label: 'Notat' });
        for (const [, p] of Object.entries(data.passages || {})) {
          const passage = p as any;
          if (passage.reference) {
            parts.push({ text: passage.reference, label: passage.book_name_no || passage.reference, ref: passage.reference });
          }
        }
        return parts;
      }
      case 'story': {
        const parts: DetailPart[] = [];
        if (data.description) parts.push({ text: data.description, label: 'Beskrivelse' });
        if (data.content) parts.push({ text: data.content, label: 'Innhold' });
        return parts;
      }
      default:
        return [];
    }
  }

  function insertSelectedContent(type: string, id: string, sourceTag: string) {
    const parts = getDetailParts(type, id);
    if (parts.length === 0) return;
    const selected = [...selectedParts].sort();
    const toInsert = selected.length > 0 ? selected.map(i => parts[i]) : parts;
    const quoted = toInsert.map(p => `> ${p.text}`).join('\n>\n');
    onInsert(`${quoted}\n>\n> — ${sourceTag}\n`);
  }

  function renderExpandedParts(type: string, id: string) {
    const cacheKey = `${type}:${id}`;
    const data = detailCache[cacheKey];

    if (loadingDetail && !data) {
      return <div className={styles.loadingText}>Laster...</div>;
    }
    if (!data) return null;

    const parts = getDetailParts(type, id);
    if (parts.length === 0) return null;

    return (
      <div className={styles.partsList}>
        {parts.map((part, i) => (
          <div
            key={i}
            className={`${styles.contentPart} ${selectedParts.has(i) ? styles.partSelected : ''}`}
            onClick={e => { e.stopPropagation(); togglePart(i); }}
          >
            <div className={styles.partHeader}>
              <span className={styles.partLabel}>{part.label}</span>
              {part.ref && (
                <button
                  className={styles.refBtn}
                  onClick={e => { e.stopPropagation(); onInsert(`[ref:${part.ref}]`); }}
                  title={`Sett inn [ref:${part.ref}]`}
                >
                  Ref
                </button>
              )}
            </div>
            <span className={styles.partText}>{part.text}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderActionBar(type: string, id: string, linkTag: string) {
    return (
      <div className={styles.actionBar}>
        <button className={styles.linkBtn} onClick={() => onInsert(linkTag)}>
          Lenke
        </button>
        <button className={styles.insertContentBtn} onClick={() => insertSelectedContent(type, id, linkTag)}>
          {selectedParts.size > 0 ? `Sett inn (${selectedParts.size})` : 'Sett inn alt'}
        </button>
      </div>
    );
  }

  const totalResults = results
    ? results.persons.length + results.prophecies.length + results.themes.length +
      results.parallels.length + results.stories.length + results.timeline.length +
      results.words.length
    : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Søk i ressurser..."
        />
        <button
          className={styles.searchButton}
          onClick={() => doSearch(query)}
          disabled={isLoading || query.trim().length < 2}
        >
          {isLoading ? '...' : 'Søk'}
        </button>
      </div>

      {results && (
        <div className={styles.results}>
          {totalResults > 0 && (
            <div className={styles.resultSummary}>{totalResults} treff</div>
          )}

          <ResultGroup
            label="Personer"
            count={results.persons.length}
            items={results.persons}
            renderItem={(p, i) => {
              const expanded = isExpanded('person', p.id);
              return (
                <div key={i} className={`${styles.resultItem} ${expanded ? styles.resultExpanded : ''}`}>
                  <div className={styles.resultClickable} onClick={() => handleExpand('person', p.id)}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{p.name}</span>
                      {p.era && <span className={styles.resultMeta}>{p.era}</span>}
                      <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                    {!expanded && p.title && <div className={styles.resultDesc}>{p.title}</div>}
                  </div>
                  {expanded && (
                    <div className={styles.expandedContent}>
                      {renderExpandedParts('person', p.id)}
                      {renderActionBar('person', p.id, `[person:${p.id}]`)}
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ResultGroup
            label="Profetier"
            count={results.prophecies.length}
            items={results.prophecies}
            renderItem={(p, i) => {
              const expanded = isExpanded('prophecy', p.id);
              return (
                <div key={i} className={`${styles.resultItem} ${expanded ? styles.resultExpanded : ''}`}>
                  <div className={styles.resultClickable} onClick={() => handleExpand('prophecy', p.id)}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{p.title}</span>
                      {p.prophecy_ref && <span className={styles.resultMeta}>{p.prophecy_ref}</span>}
                      <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                    {!expanded && p.category_name && <div className={styles.resultDesc}>{p.category_name}</div>}
                  </div>
                  {expanded && (
                    <div className={styles.expandedContent}>
                      {renderExpandedParts('prophecy', p.id)}
                      {renderActionBar('prophecy', p.id, `[profeti:${p.id}]`)}
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ResultGroup
            label="Temaer"
            count={results.themes.length}
            items={results.themes}
            renderItem={(t, i) => {
              const expanded = isExpanded('theme', String(t.id));
              return (
                <div key={i} className={`${styles.resultItem} ${expanded ? styles.resultExpanded : ''}`}>
                  <div className={styles.resultClickable} onClick={() => handleExpand('theme', String(t.id))}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{t.name}</span>
                      <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                  </div>
                  {expanded && (
                    <div className={styles.expandedContent}>
                      {renderExpandedParts('theme', String(t.id))}
                      {renderActionBar('theme', String(t.id), `[tema:${t.name}]`)}
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ResultGroup
            label="Paralleller"
            count={results.parallels.length}
            items={results.parallels}
            renderItem={(p, i) => {
              const expanded = isExpanded('parallel', p.id);
              return (
                <div key={i} className={`${styles.resultItem} ${expanded ? styles.resultExpanded : ''}`}>
                  <div className={styles.resultClickable} onClick={() => handleExpand('parallel', p.id)}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{p.title}</span>
                      <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                    {!expanded && p.section_name && <div className={styles.resultDesc}>{p.section_name}</div>}
                  </div>
                  {expanded && (
                    <div className={styles.expandedContent}>
                      {renderExpandedParts('parallel', p.id)}
                      {renderActionBar('parallel', p.id, `[parallell:${p.id}]`)}
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ResultGroup
            label="Historier"
            count={results.stories.length}
            items={results.stories}
            renderItem={(s, i) => {
              const expanded = isExpanded('story', s.slug);
              return (
                <div key={i} className={`${styles.resultItem} ${expanded ? styles.resultExpanded : ''}`}>
                  <div className={styles.resultClickable} onClick={() => handleExpand('story', s.slug)}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{s.title}</span>
                      <span className={styles.resultMeta}>{s.category}</span>
                      <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                    {!expanded && s.description && <div className={styles.resultDesc}>{s.description}</div>}
                  </div>
                  {expanded && (
                    <div className={styles.expandedContent}>
                      {renderExpandedParts('story', s.slug)}
                      {renderActionBar('story', s.slug, `[historie:${s.slug}]`)}
                    </div>
                  )}
                </div>
              );
            }}
          />

          <ResultGroup
            label="Tidslinje"
            count={results.timeline.length}
            items={results.timeline}
            renderItem={(t, i) => (
              <div key={i} className={styles.resultItem}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultTitle}>{t.title}</span>
                  {t.year_display && <span className={styles.resultMeta}>{t.year_display}</span>}
                </div>
                {t.description && <div className={styles.resultDesc}>{t.description}</div>}
              </div>
            )}
          />

          <ResultGroup
            label="Viktige ord"
            count={results.words.length}
            items={results.words}
            renderItem={(w, i) => (
              <div key={i} className={styles.resultItem}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultTitle}>{w.word}</span>
                  <span className={styles.resultMeta}>{w.book_name_no} {w.chapter}</span>
                </div>
                <div className={styles.resultDesc}>{w.explanation}</div>
              </div>
            )}
          />

          {totalResults === 0 && (
            <p className={styles.noResults}>Ingen treff</p>
          )}
        </div>
      )}

      {hasSearched && !results && !isLoading && (
        <p className={styles.noResults}>Søket feilet</p>
      )}
    </div>
  );
}
