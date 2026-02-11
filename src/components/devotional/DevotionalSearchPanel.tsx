import { useState, useEffect, useRef, useCallback } from 'react';
import { useDevotionals } from '@/components/DevotionalsContext';
import { parseStandardRef } from '@/lib/standard-ref-parser';
import { getCurrentContent } from '@/lib/devotional-utils';
import { devotionalTypeLabels } from '@/types/devotional';
import type { Devotional } from '@/types/devotional';
import styles from './DevotionalSearchPanel.module.scss';

interface DevotionalSearchPanelProps {
  onClose: () => void;
  onInsertText: (text: string) => void;
  currentDevotionalId?: string;
}

export function DevotionalSearchPanel({ onClose, onInsertText, currentDevotionalId }: DevotionalSearchPanelProps) {
  const { getDevotionalsForVerse, searchDevotionals } = useDevotionals();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Devotional[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const seen = new Set<string>();
    const merged: Devotional[] = [];

    // 1. Try verse search via parseStandardRef
    const segments = parseStandardRef(q);
    if (segments.length > 0) {
      for (const seg of segments) {
        const firstVerse = seg.verses?.[0] || seg.fromVerse || 1;
        const ref = `${seg.bookShortName.toLowerCase()}-${seg.chapter}-${firstVerse}`;
        const verseHits = getDevotionalsForVerse(ref);
        for (const d of verseHits) {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            merged.push(d);
          }
        }
      }
    }

    // 2. Free text search
    const textHits = searchDevotionals(q);
    for (const d of textHits) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        merged.push(d);
      }
    }

    // Exclude current devotional
    const filtered = currentDevotionalId
      ? merged.filter(d => d.id !== currentDevotionalId)
      : merged;

    setResults(filtered.slice(0, 20));
  }, [getDevotionalsForVerse, searchDevotionals, currentDevotionalId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setSelectedParagraphs(new Set());
    } else {
      setExpandedId(id);
      setSelectedParagraphs(new Set());
    }
  }

  function toggleParagraph(index: number) {
    setSelectedParagraphs(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleInsertLink(slug: string) {
    onInsertText(`[manuskript:${slug}]`);
  }

  function handleInsertContent(devotional: Devotional, paragraphs: string[]) {
    const selected = [...selectedParagraphs].sort((a, b) => a - b);
    const toInsert = selected.length > 0
      ? selected.map(i => paragraphs[i]).filter(Boolean)
      : paragraphs;

    const quoted = toInsert.map(p => `> ${p}`).join('\n>\n');
    const text = `${quoted}\n>\n> — [manuskript:${devotional.slug}]\n`;
    onInsertText(text);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Manuskripter</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder="Søk vers eller tekst..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className={styles.results}>
        {query.trim() && results.length === 0 && (
          <p className={styles.noResults}>Ingen treff</p>
        )}

        {results.map(d => {
          const content = getCurrentContent(d);
          const paragraphs = content.split('\n\n').filter(p => p.trim());
          const isExpanded = expandedId === d.id;

          return (
            <div key={d.id} className={`${styles.resultCard} ${isExpanded ? styles.resultExpanded : ''}`}>
              <div className={styles.resultHeader} onClick={() => handleExpand(d.id)}>
                <div className={styles.resultTitle}>{d.title}</div>
                <div className={styles.resultMeta}>
                  <span className={styles.typeBadge}>{devotionalTypeLabels[d.type]}</span>
                  <span className={styles.resultDate}>{d.date}</span>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.resultContent}>
                  <div className={styles.paragraphs}>
                    {paragraphs.map((p, i) => (
                      <div
                        key={i}
                        className={`${styles.paragraph} ${selectedParagraphs.has(i) ? styles.paragraphSelected : ''}`}
                        onClick={() => toggleParagraph(i)}
                      >
                        {p}
                      </div>
                    ))}
                  </div>

                  <div className={styles.insertActions}>
                    <button
                      className={styles.linkButton}
                      onClick={() => handleInsertLink(d.slug)}
                    >
                      Lenke
                    </button>
                    <button
                      className={styles.insertButton}
                      onClick={() => handleInsertContent(d, paragraphs)}
                    >
                      {selectedParagraphs.size > 0
                        ? `Sett inn (${selectedParagraphs.size})`
                        : 'Sett inn alt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
