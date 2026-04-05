import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ItemTagging } from '@/components/ItemTagging';
import { Footnotes } from '@/components/Footnotes';
import { InlineRefs } from '@/components/InlineRefs';
import { booksData } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import type { DayData, DayReference } from '@/lib/bible';
import styles from '@/styles/pages/day.module.scss';

const categoryLabels: Record<string, string> = {
  advent: 'Advent',
  christmas: 'Jul',
  epiphany: 'Åpenbaring',
  lent: 'Faste',
  easter: 'Påske',
  ascension: 'Himmelfart',
  pentecost: 'Pinse',
  trinity: 'Treenighetstiden',
  special: 'Spesielle dager',
  jewish: 'Jødiske høytider',
};

function formatRef(ref: DayReference): string {
  const book = booksData.find(b => b.id === ref.bookId);
  const name = book?.name_no || `Bok ${ref.bookId}`;
  if (ref.fromVerseId === ref.toVerseId) {
    return `${name} ${ref.chapterId}:${ref.fromVerseId}`;
  }
  return `${name} ${ref.chapterId}:${ref.fromVerseId}-${ref.toVerseId}`;
}

function refToUrl(ref: DayReference): string {
  const book = booksData.find(b => b.id === ref.bookId);
  const slug = book ? toUrlSlug(book.short_name) : '';
  return `/${slug}/${ref.chapterId}#v${ref.fromVerseId}`;
}

function getNextDate(dates: Record<string, string>): string | null {
  const today = new Date().toISOString().substring(0, 10);
  const future = Object.values(dates).filter(d => d >= today).sort();
  return future[0] || null;
}

export function DayPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dayId) return;

    async function fetchData() {
      try {
        const response = await fetch(`/api/days/${encodeURIComponent(dayId!)}`);
        if (response.status === 404) {
          navigate('/dager', { replace: true });
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch');

        const result = await response.json();
        const parsed = JSON.parse(result.content);
        parsed.references = parsed.references || [];
        setData(parsed);
      } catch (err) {
        console.error('Failed to fetch day:', err);
        setError('Kunne ikke laste dag');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [dayId, navigate]);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Dager', href: '/dager' },
            { label: 'Laster...' }
          ]} />
          <p>Laster...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Dager', href: '/dager' },
            { label: 'Feil' }
          ]} />
          <h1>Feil</h1>
          <p>{error || 'Fant ikke dagen'}</p>
        </div>
      </div>
    );
  }

  const nextDate = getNextDate(data.dates);
  const refs = data.references || [];
  const primaryRefs = refs.filter(r => r.relevance === 'primary');
  const secondaryRefs = refs.filter(r => r.relevance === 'secondary');

  const contentSections: { title: string; text: string }[] = [];
  if (data.biblicalBasis) contentSections.push({ title: 'Bibelsk grunnlag', text: data.biblicalBasis });
  if (data.significance) contentSections.push({ title: 'Betydning', text: data.significance });
  if (data.otConnections) contentSections.push({ title: 'GT-forbindelser', text: data.otConnections });
  if (data.liturgicalContext) contentSections.push({ title: 'Liturgisk kontekst', text: data.liturgicalContext });
  if (data.history) contentSections.push({ title: 'Historie', text: data.history });

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Dager', href: '/dager' },
          { label: data.name }
        ]} />

        <header className={styles.header}>
          <h1>{data.name}</h1>
          <div className={styles.meta}>
            <span className={styles.categoryBadge}>{categoryLabels[data.category] || data.category}</span>
            {nextDate && (
              <span className={styles.nextDate}>
                Neste: {new Date(nextDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </header>

        <div className={styles.taggingSection}>
          <ItemTagging itemType="day" itemId={data.id} />
        </div>

        <div className={styles.description}>
          <p>{data.description}{data.footnotes && data.footnotes.length > 0 && (
            <Footnotes footnotes={data.footnotes} defaultOpen />
          )}</p>
        </div>

        {contentSections.map((section) => (
          <section key={section.title} className={styles.contentSection}>
            <h2>{section.title}</h2>
            <p><InlineRefs>{section.text}</InlineRefs></p>
          </section>
        ))}

        {primaryRefs.length > 0 && (
          <section className={styles.refsSection}>
            <h2>Hovedtekster</h2>
            <div className={styles.refCards}>
              {primaryRefs.map((ref, i) => (
                <Link key={i} to={refToUrl(ref)} className={styles.refCard}>
                  <span className={styles.refName}>{formatRef(ref)}</span>
                  {ref.reason && <span className={styles.refReason}>{ref.reason}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {secondaryRefs.length > 0 && (
          <section className={styles.refsSection}>
            <h2>Andre tekster</h2>
            <div className={styles.refCards}>
              {secondaryRefs.map((ref, i) => (
                <Link key={i} to={refToUrl(ref)} className={styles.refCard}>
                  <span className={styles.refName}>{formatRef(ref)}</span>
                  {ref.reason && <span className={styles.refReason}>{ref.reason}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {Object.keys(data.dates).length > 0 && (
          <section className={styles.datesSection}>
            <h2>Datoer</h2>
            <div className={styles.dateList}>
              {Object.entries(data.dates).sort(([a], [b]) => a.localeCompare(b)).map(([year, date]) => (
                <div key={year} className={styles.dateItem}>
                  <span className={styles.dateYear}>{year}</span>
                  <span className={styles.dateValue}>
                    {new Date(date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
