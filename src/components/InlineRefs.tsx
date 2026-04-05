import { useState, useCallback, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { useDevotionals } from '@/components/DevotionalsContext';
import { useSettings } from '@/components/SettingsContext';
import { verseRefToUrl } from '@/lib/devotional-utils';
import { parseStandardRef, refSegmentsToVerseRefs, refSegmentToUrl } from '@/lib/standard-ref-parser';
import { getBookInfoBySlug } from '@/lib/books-data';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import type { Verse } from '@/lib/bible';
import styles from './InlineRefs.module.scss';

// Re-export the ref pattern for use in other components
export const REF_PATTERN = /\[(vers|ref|manuskript|andakt|tema|person|profeti|parallell|historie):([^\]]+)\]/g;

/** Check whether a string contains any bracket references */
export function hasInlineRefs(text: string): boolean {
  REF_PATTERN.lastIndex = 0;
  return REF_PATTERN.test(text);
}

interface VerseWithOriginal {
  verse: Verse;
  originalText: string | null;
  originalLanguage: 'hebrew' | 'greek';
  bookShortName: string;
}

type SegmentType = 'text' | 'vers' | 'ref' | 'manuskript' | 'tema' | 'person' | 'profeti' | 'parallell' | 'historie';

interface Segment {
  type: SegmentType;
  value: string;
}

function parseLegacyRef(ref: string): { bookId: number; chapter: number; verse: number } | null {
  const parts = ref.split('-');
  if (parts.length < 3) return null;
  for (let i = parts.length - 2; i >= 1; i--) {
    const bookSlug = parts.slice(0, i).join('');
    const book = getBookInfoBySlug(bookSlug);
    if (book) {
      const chapter = parseInt(parts[i]);
      const verse = parseInt(parts[i + 1]);
      if (!isNaN(chapter) && !isNaN(verse)) {
        return { bookId: book.id, chapter, verse };
      }
    }
  }
  return null;
}

function parseRefBible(refStr: string): { ref: string; bibleOverride?: string } {
  const atIdx = refStr.lastIndexOf('@');
  if (atIdx > 0) {
    const possibleBible = refStr.substring(atIdx + 1).trim();
    if (possibleBible && /^[a-z0-9_-]+$/i.test(possibleBible)) {
      return { ref: refStr.substring(0, atIdx).trim(), bibleOverride: possibleBible };
    }
  }
  return { ref: refStr };
}

// ── Verse ref display ──

function RefVerseDisplay({ refStr, isLegacy, customLabel }: { refStr: string; isLegacy?: boolean; customLabel?: string }) {
  const { settings } = useSettings();
  const [verseData, setVerseData] = useState<VerseWithOriginal[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const { ref, bibleOverride } = useMemo(() => parseRefBible(refStr), [refStr]);
  const settingsBible = settings.bible?.startsWith('user:') ? 'osnb2' : (settings.bible || 'osnb2');
  const bible = bibleOverride || settingsBible;

  const { url, displayLabel } = useMemo(() => {
    if (isLegacy) {
      return { url: verseRefToUrl(ref), displayLabel: customLabel || ref };
    }
    const segments = parseStandardRef(ref);
    const first = segments[0];
    return {
      url: first ? refSegmentToUrl(first) : '#',
      displayLabel: customLabel || ref,
    };
  }, [ref, isLegacy, customLabel]);

  const fetchVerses = useCallback(async () => {
    setLoading(true);
    try {
      let data: VerseWithOriginal[];
      if (isLegacy) {
        const parsed = parseLegacyRef(ref);
        if (!parsed) { setLoading(false); return; }
        const refs = [{ bookId: parsed.bookId, chapter: parsed.chapter, verses: [parsed.verse] }];
        const response = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs, bible }),
        });
        data = await response.json();
      } else {
        const segments = parseStandardRef(ref);
        const refs = refSegmentsToVerseRefs(segments);
        const response = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs, bible }),
        });
        data = await response.json();
      }
      setVerseData(data || []);
    } catch {
      setVerseData([]);
    }
    setLoading(false);
  }, [ref, isLegacy, bible]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (verseData === null) {
      await fetchVerses();
    }
    setExpanded(true);
  }, [expanded, verseData, fetchVerses]);

  return (
    <span className={styles.verseRefWrapper}>
      <a
        href={url}
        className={styles.verseRef}
        data-inline-ref
        onClick={handleClick}
        title={`Vis ${displayLabel}`}
      >
        {displayLabel}
      </a>
      {loading && <span className={styles.verseLoading}> ...</span>}
      {expanded && verseData && verseData.length > 0 && (
        <span className={styles.verseBlock}>
          {verseData.map((v, i) => (
            <VerseDisplay
              key={i}
              verse={v.verse}
              bookId={v.verse.book_id}
              originalText={v.originalText ?? undefined}
              originalLanguage={v.originalLanguage}
            />
          ))}
          <Link to={url} className={styles.verseInlineLink}>Les i kontekst</Link>
        </span>
      )}
      {expanded && verseData && verseData.length === 0 && (
        <span className={styles.verseInline}>
          <span className={styles.verseInlineText}>Vers ikke funnet</span>
        </span>
      )}
    </span>
  );
}

// ── Resource ref display ──

type ResourceType = 'tema' | 'person' | 'profeti' | 'parallell' | 'historie';

let propheciesCache: Promise<{ categories: unknown[]; prophecies: unknown[] }> | null = null;

function getResourceUrl(type: ResourceType, value: string): string {
  switch (type) {
    case 'tema': return `/temaer#tema-${value.toLowerCase().replace(/\s+/g, '-')}`;
    case 'person': return `/personer/${value}`;
    case 'profeti': return `/profetier#profeti-${value}`;
    case 'parallell': return `/paralleller/${value}`;
    case 'historie': return `/historier/${value}`;
  }
}

function getResourceApiUrl(type: ResourceType, value: string): string {
  switch (type) {
    case 'tema': return `/api/themes/${encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'))}`;
    case 'person': return `/api/persons/${encodeURIComponent(value)}`;
    case 'profeti': return '';
    case 'parallell': return `/api/parallels/${encodeURIComponent(value)}`;
    case 'historie': return `/api/stories/${encodeURIComponent(value)}`;
  }
}

async function fetchResourceData(type: ResourceType, value: string): Promise<Record<string, unknown> | null> {
  if (type === 'profeti') {
    if (!propheciesCache) {
      propheciesCache = fetch('/api/prophecies').then(r => r.json());
    }
    const data = await propheciesCache;
    const prophecy = (data.prophecies as { id: string }[]).find(
      p => p.id === value || p.id === `prop-${value}`
    );
    return prophecy ? (prophecy as Record<string, unknown>) : null;
  }

  const url = getResourceApiUrl(type, value);
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

function renderThemeContent(data: Record<string, unknown>): React.ReactNode {
  const content = data.content as string;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as { title?: string; introduction?: string; sections?: { title: string; description?: string }[] };
    return (
      <>
        {parsed.introduction && <p>{parsed.introduction}</p>}
        {parsed.sections && parsed.sections.length > 0 && (
          <ul>
            {parsed.sections.map((s, i) => (
              <li key={i}><strong>{s.title}</strong>{s.description ? ` — ${s.description}` : ''}</li>
            ))}
          </ul>
        )}
      </>
    );
  } catch {
    const lines = content.split('\n').filter(l => l.includes(':'));
    if (lines.length === 0) return <p>{content.substring(0, 200)}</p>;
    return (
      <ul>
        {lines.slice(0, 8).map((line, i) => {
          const idx = line.indexOf(':');
          return <li key={i}><strong>{line.substring(0, idx).trim()}</strong>{line.substring(idx)}</li>;
        })}
      </ul>
    );
  }
}

function renderPersonContent(data: Record<string, unknown>): React.ReactNode {
  const person = data as { name?: string; title?: string; era?: string; summary?: string; roles?: string[] };
  const eraLabels: Record<string, string> = {
    'creation': 'Skapelsen', 'patriarchs': 'Patriarkene', 'exodus': 'Utgang fra Egypt',
    'conquest': 'Erobringen', 'judges': 'Dommertiden', 'united-kingdom': 'Det forente kongerike',
    'divided-kingdom': 'Det delte kongerike', 'exile': 'Eksilet', 'return': 'Tilbakekomsten',
    'intertestamental': 'Mellomtestamentlig tid', 'jesus': 'Jesu tid', 'early-church': 'Den tidlige kirke',
  };
  return (
    <>
      {person.title && <span className={styles.resourceTitle}>{person.name} — {person.title}</span>}
      {(person.era || person.roles) && (
        <span className={styles.resourceMeta}>
          {person.era && (eraLabels[person.era] || person.era)}
          {person.era && person.roles && person.roles.length > 0 && ' · '}
          {person.roles && person.roles.join(', ')}
        </span>
      )}
      {person.summary && <p>{person.summary}</p>}
    </>
  );
}

function renderProphecyContent(data: Record<string, unknown>): React.ReactNode {
  const prophecy = data as {
    title?: string; explanation?: string | null;
    prophecy?: { reference?: string; book_name_no?: string };
    fulfillments?: { reference?: string; book_name_no?: string }[];
  };
  return (
    <>
      {prophecy.title && <span className={styles.resourceTitle}>{prophecy.title}</span>}
      {prophecy.explanation && <p><InlineRefs>{prophecy.explanation}</InlineRefs></p>}
      {prophecy.prophecy?.reference && (
        <p><strong>Profeti:</strong> {prophecy.prophecy.book_name_no} ({prophecy.prophecy.reference})</p>
      )}
      {prophecy.fulfillments && prophecy.fulfillments.length > 0 && (
        <>
          <strong>Oppfyllelser:</strong>
          <ul>
            {prophecy.fulfillments.map((f, i) => (
              <li key={i}>{f.book_name_no} ({f.reference})</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function renderParallelContent(data: Record<string, unknown>): React.ReactNode {
  const parallel = data as {
    title?: string; notes?: string | null;
    passages?: Record<string, { gospel: string; reference: string; book_name_no?: string }>;
  };
  return (
    <>
      {parallel.title && <span className={styles.resourceTitle}>{parallel.title}</span>}
      {parallel.notes && <p>{parallel.notes}</p>}
      {parallel.passages && Object.keys(parallel.passages).length > 0 && (
        <ul>
          {Object.values(parallel.passages).map((p, i) => (
            <li key={i}>{p.book_name_no || p.gospel}: {p.reference}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function renderStoryContent(data: Record<string, unknown>): React.ReactNode {
  const story = data as { title?: string; description?: string | null; category?: string };
  return (
    <>
      {story.title && <span className={styles.resourceTitle}>{story.title}</span>}
      {story.category && <span className={styles.resourceMeta}>{story.category}</span>}
      {story.description && <p>{story.description}</p>}
    </>
  );
}

function ResourceRefDisplay({ type, value, customLabel }: { type: ResourceType; value: string; customLabel?: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const url = useMemo(() => getResourceUrl(type, value), [type, value]);
  const displayLabel = customLabel || value;

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (data === null && !error) {
      setLoading(true);
      try {
        const result = await fetchResourceData(type, value);
        if (result) {
          setData(result);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    setExpanded(true);
  }, [expanded, data, error, type, value]);

  const renderContent = () => {
    if (!data) return null;
    switch (type) {
      case 'tema': return renderThemeContent(data);
      case 'person': return renderPersonContent(data);
      case 'profeti': return renderProphecyContent(data);
      case 'parallell': return renderParallelContent(data);
      case 'historie': return renderStoryContent(data);
    }
  };

  return (
    <span className={styles.resourceRefWrapper}>
      <a
        href={url}
        className={styles.resourceRef}
        onClick={handleClick}
        title={`Vis ${displayLabel}`}
      >
        {displayLabel}
      </a>
      {loading && <span className={styles.verseLoading}> ...</span>}
      {expanded && data && (
        <span className={styles.resourceBlock}>
          <span className={styles.resourceContent}>{renderContent()}</span>
          <Link to={url} className={styles.resourceLink}>Se fullstendig ›</Link>
        </span>
      )}
      {expanded && error && (
        <span className={styles.verseInline}>
          <span className={styles.verseInlineText}>Kunne ikke hente innhold</span>
        </span>
      )}
    </span>
  );
}

// ── Devotional link (expandable) ──

function getDevotionalContent(devotional: { versions: { content: string; locked: boolean }[] }): string {
  // Prefer the latest locked version; fall back to the draft
  for (let i = devotional.versions.length - 1; i >= 0; i--) {
    if (devotional.versions[i].locked && devotional.versions[i].content) {
      return devotional.versions[i].content;
    }
  }
  // Fall back to last version with content
  for (let i = devotional.versions.length - 1; i >= 0; i--) {
    if (devotional.versions[i].content) {
      return devotional.versions[i].content;
    }
  }
  return '';
}

function DevotionalLink({ slug, customLabel }: { slug: string; customLabel?: string }) {
  const { getDevotionalBySlug } = useDevotionals();
  const devotional = getDevotionalBySlug(slug);
  const title = devotional?.title || slug;
  const displayLabel = customLabel || title;
  const [expanded, setExpanded] = useState(false);

  const url = `/manuskripter/${slug}`;
  const content = devotional ? getDevotionalContent(devotional) : '';

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded(prev => !prev);
  }, []);

  return (
    <span className={styles.resourceRefWrapper}>
      <a
        href={url}
        className={styles.devotionalRef}
        onClick={handleClick}
        title={title}
      >
        {displayLabel}
      </a>
      {expanded && content && (
        <span className={styles.devotionalBlock}>
          <span className={styles.resourceTitle}>{title}</span>
          <span className={styles.devotionalContent}>
            <InlineRefs markdown>{content}</InlineRefs>
          </span>
          <Link to={url} className={styles.resourceLink}>Åpne manuskript ›</Link>
        </span>
      )}
      {expanded && !content && (
        <span className={styles.verseInline}>
          <span className={styles.verseInlineText}>Manuskript ikke funnet</span>
        </span>
      )}
    </span>
  );
}

// ── Segment parsing ──

function parseSegments(content: string): Segment[] {
  const pattern = /\[(vers|ref|manuskript|andakt|tema|person|profeti|parallell|historie):([^\]]+)\]/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.substring(lastIndex, match.index) });
    }
    const matchType = match[1] === 'andakt' ? 'manuskript' : match[1] as SegmentType;
    segments.push({ type: matchType, value: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.substring(lastIndex) });
  }
  return segments;
}

// ── Public components ──

interface InlineRefsProps {
  /** The text content to parse for bracket references */
  children: string;
  /** Render text segments as Markdown (default: false = plain text) */
  markdown?: boolean;
}

/**
 * Renders text with [ref:], [tema:], [person:], etc. bracket references
 * replaced by interactive inline components.
 *
 * Use `markdown` prop to render text segments through ReactMarkdown (for rich content).
 * Without it, text segments are rendered as plain text (for summaries, descriptions, etc.).
 */
export function InlineRefs({ children, markdown = false }: InlineRefsProps) {
  const segments = useMemo(() => parseSegments(children), [children]);

  // Fast path: no refs found, just render text
  if (segments.length === 1 && segments[0].type === 'text') {
    if (markdown) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children: linkChildren }) => {
              if (href?.startsWith('/')) {
                return <Link to={href}>{linkChildren}</Link>;
              }
              return <a href={href} target="_blank" rel="noopener noreferrer">{linkChildren}</a>;
            },
          }}
        >
          {children}
        </ReactMarkdown>
      );
    }
    return <>{children}</>;
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'ref' || seg.type === 'vers') {
          const pipeIdx = seg.value.indexOf('|');
          const refStr = pipeIdx >= 0 ? seg.value.substring(0, pipeIdx).trim() : seg.value;
          const customLabel = pipeIdx >= 0 ? seg.value.substring(pipeIdx + 1).trim() : undefined;
          return <RefVerseDisplay key={i} refStr={refStr} customLabel={customLabel} isLegacy={seg.type === 'vers'} />;
        }
        if (seg.type === 'manuskript') {
          const pipeIdx = seg.value.indexOf('|');
          const slugVal = pipeIdx >= 0 ? seg.value.substring(0, pipeIdx).trim() : seg.value;
          const label = pipeIdx >= 0 ? seg.value.substring(pipeIdx + 1).trim() : undefined;
          return <DevotionalLink key={i} slug={slugVal} customLabel={label} />;
        }
        if (seg.type === 'tema' || seg.type === 'person' || seg.type === 'profeti' || seg.type === 'parallell' || seg.type === 'historie') {
          const pipeIdx = seg.value.indexOf('|');
          const val = pipeIdx >= 0 ? seg.value.substring(0, pipeIdx).trim() : seg.value;
          const label = pipeIdx >= 0 ? seg.value.substring(pipeIdx + 1).trim() : undefined;
          return <ResourceRefDisplay key={i} type={seg.type} value={val} customLabel={label} />;
        }
        // Text segment
        if (markdown) {
          return (
            <ReactMarkdown
              key={i}
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children: linkChildren }) => {
                  if (href?.startsWith('/')) {
                    return <Link to={href}>{linkChildren}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer">{linkChildren}</a>;
                },
              }}
            >
              {seg.value}
            </ReactMarkdown>
          );
        }
        return <Fragment key={i}>{seg.value}</Fragment>;
      })}
    </>
  );
}
