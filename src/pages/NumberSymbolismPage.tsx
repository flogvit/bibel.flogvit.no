import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ItemTagging } from '@/components/ItemTagging';
import { Footnotes } from '@/components/Footnotes';
import { booksData } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import type { NumberSymbolismData } from '@/lib/bible';
import styles from '@/styles/pages/number-symbolism.module.scss';

function getBookName(bookId: number): string {
  const book = booksData.find(b => b.id === bookId);
  return book?.name_no || `Bok ${bookId}`;
}

function getBookShortName(bookId: number): string {
  const book = booksData.find(b => b.id === bookId);
  return book?.short_name || '';
}

function formatRef(ref: NumberSymbolismData['references'][0]): string {
  const name = getBookName(ref.bookId);
  if (ref.fromVerseId === ref.toVerseId) {
    return `${name} ${ref.chapterId}:${ref.fromVerseId}`;
  }
  return `${name} ${ref.chapterId}:${ref.fromVerseId}-${ref.toVerseId}`;
}

function refToUrl(ref: NumberSymbolismData['references'][0]): string {
  const shortName = getBookShortName(ref.bookId);
  return `/${toUrlSlug(shortName)}/${ref.chapterId}#v${ref.fromVerseId}`;
}

export function NumberSymbolismPage() {
  const { number } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<NumberSymbolismData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!number) return;

    async function fetchData() {
      try {
        const response = await fetch(`/api/number-symbolism/${number}`);

        if (response.status === 404) {
          navigate('/tall', { replace: true });
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch');

        const result = await response.json();
        const parsed: NumberSymbolismData = JSON.parse(result.content);
        setData(parsed);
      } catch (err) {
        console.error('Failed to fetch number symbolism:', err);
        setError('Kunne ikke laste tall');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [number, navigate]);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Tall', href: '/tall' },
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
            { label: 'Tall', href: '/tall' },
            { label: 'Feil' }
          ]} />
          <h1>Feil</h1>
          <p>{error || 'Fant ikke tall'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Tall', href: '/tall' },
          { label: `Tallet ${data.number}` }
        ]} />

        <div className={styles.header}>
          <span className={styles.bigNumber}>{data.number}</span>
          <div>
            <h1>{data.meaning}</h1>
          </div>
        </div>

        <div className={styles.taggingSection}>
          <ItemTagging itemType="number-symbolism" itemId={String(data.number)} />
        </div>

        <div className={styles.description}>
          <p>{data.description}{data.footnotes && data.footnotes.length > 0 && (
            <Footnotes footnotes={data.footnotes} defaultOpen />
          )}</p>
        </div>

        {data.references.length > 0 && (
          <div className={styles.references}>
            <h2>Bibelreferanser ({data.references.length})</h2>
            <div className={styles.refList}>
              {data.references.map((ref, i) => (
                <Link
                  key={i}
                  to={refToUrl(ref)}
                  className={styles.refCard}
                >
                  {formatRef(ref)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
