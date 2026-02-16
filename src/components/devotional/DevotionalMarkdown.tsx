import { useState, useCallback, useMemo } from 'react';
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
import styles from './DevotionalMarkdown.module.scss';

interface DevotionalMarkdownProps {
  content: string;
}

interface VerseWithOriginal {
  verse: Verse;
  originalText: string | null;
  originalLanguage: 'hebrew' | 'greek';
  bookShortName: string;
}

/**
 * Parses a legacy verse ref "joh-3-16" into { bookId, chapter, verse }.
 */
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

/**
 * Parse optional @bible suffix from a ref string.
 * e.g. "Joh 3,16@osnb2" => { ref: "Joh 3,16", bibleOverride: "osnb2" }
 * e.g. "Joh 3,16" => { ref: "Joh 3,16", bibleOverride: undefined }
 */
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

function RefVerseDisplay({ refStr, isLegacy }: { refStr: string; isLegacy?: boolean }) {
  const { settings } = useSettings();
  const [verseData, setVerseData] = useState<VerseWithOriginal[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const { ref, bibleOverride } = useMemo(() => parseRefBible(refStr), [refStr]);
  const settingsBible = settings.bible?.startsWith('user:') ? 'osnb2' : (settings.bible || 'osnb2');
  const bible = bibleOverride || settingsBible;

  const { url, displayLabel } = useMemo(() => {
    if (isLegacy) {
      return { url: verseRefToUrl(ref), displayLabel: ref };
    }
    const segments = parseStandardRef(ref);
    const first = segments[0];
    return {
      url: first ? refSegmentToUrl(first) : '#',
      displayLabel: ref,
    };
  }, [ref, isLegacy]);

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

function DevotionalLink({ slug }: { slug: string }) {
  const { getDevotionalBySlug } = useDevotionals();
  const devotional = getDevotionalBySlug(slug);
  const title = devotional?.title || slug;

  return (
    <Link to={`/manuskripter/${slug}`} className={styles.devotionalRef} title={title}>
      {title}
    </Link>
  );
}

/**
 * Render content with [vers:], [ref:], and [manuskript:]/[andakt:] patterns replaced by React components.
 * Instead of converting to markdown links (which breaks on spaces in URLs),
 * we split the content into segments and render each part separately.
 */
export function DevotionalMarkdown({ content }: DevotionalMarkdownProps) {
  // Split content into text segments and reference segments
  const refPattern = /\[(vers|ref|manuskript|andakt|tema|person|profeti|parallell|historie):([^\]]+)\]/g;
  const segments: { type: 'text' | 'vers' | 'ref' | 'manuskript' | 'tema' | 'person' | 'profeti' | 'parallell' | 'historie'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = refPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.substring(lastIndex, match.index) });
    }
    const matchType = match[1] === 'andakt' ? 'manuskript' : match[1] as typeof segments[number]['type'];
    segments.push({ type: matchType, value: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.substring(lastIndex) });
  }

  return (
    <div className={styles.markdown}>
      {segments.map((seg, i) => {
        if (seg.type === 'ref') {
          return <RefVerseDisplay key={i} refStr={seg.value} />;
        }
        if (seg.type === 'vers') {
          return <RefVerseDisplay key={i} refStr={seg.value} isLegacy />;
        }
        if (seg.type === 'manuskript') {
          return <DevotionalLink key={i} slug={seg.value} />;
        }
        if (seg.type === 'tema') {
          const slug = seg.value.toLowerCase().replace(/\s+/g, '-');
          return <Link key={i} to={`/temaer#tema-${slug}`} className={styles.resourceRef}>{seg.value}</Link>;
        }
        if (seg.type === 'person') {
          return <Link key={i} to={`/personer/${seg.value}`} className={styles.resourceRef}>{seg.value}</Link>;
        }
        if (seg.type === 'profeti') {
          return <Link key={i} to={`/profetier#profeti-${seg.value}`} className={styles.resourceRef}>{seg.value}</Link>;
        }
        if (seg.type === 'parallell') {
          return <Link key={i} to={`/paralleller/${seg.value}`} className={styles.resourceRef}>{seg.value}</Link>;
        }
        if (seg.type === 'historie') {
          return <Link key={i} to={`/historier/${seg.value}`} className={styles.resourceRef}>{seg.value}</Link>;
        }
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('/')) {
                  return <Link to={href}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
              },
            }}
          >
            {seg.value}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
