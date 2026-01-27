import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeVerseDisplay } from '@/components/bible/ThemeVerseDisplay';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ItemTagging } from '@/components/ItemTagging';
import styles from '@/styles/pages/theme.module.scss';

interface ThemeData {
  title: string;
  introduction?: string;
  sections: Array<{
    title: string;
    description?: string;
    verses: Array<{
      ref: string;
      text?: string;
    }>;
  }>;
}

interface ThemeItem {
  title: string;
  description: string;
}

export function ThemePage() {
  const { tema } = useParams<{ tema: string }>();
  const navigate = useNavigate();
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [oldFormatItems, setOldFormatItems] = useState<ThemeItem[]>([]);
  const [isJsonFormat, setIsJsonFormat] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tema) return;

    async function fetchTheme() {
      try {
        const response = await fetch(`/api/themes/${encodeURIComponent(tema)}`);

        if (response.status === 404) {
          navigate('/temaer', { replace: true });
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch theme');

        const theme = await response.json();

        // Check if JSON format
        try {
          const parsed = JSON.parse(theme.content);
          setThemeData(parsed);
          setIsJsonFormat(true);
          setDisplayName(parsed.title || tema);
        } catch {
          // Old txt format
          setIsJsonFormat(false);
          setDisplayName(tema.charAt(0).toUpperCase() + tema.slice(1));

          // Parse old format
          const lines = theme.content.split('\n').filter((l: string) => l.trim());
          const items = lines.map((line: string) => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
              return {
                title: line.substring(0, colonIdx).trim(),
                description: line.substring(colonIdx + 1).trim(),
              };
            }
            return { title: line, description: '' };
          });
          setOldFormatItems(items);
        }
      } catch (err) {
        console.error('Failed to fetch theme:', err);
        setError('Kunne ikke laste tema');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTheme();
  }, [tema, navigate]);

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Temaer', href: '/temaer' },
            { label: 'Laster...' }
          ]} />
          <p>Laster tema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Temaer', href: '/temaer' },
            { label: 'Feil' }
          ]} />
          <h1>Feil</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isJsonFormat && themeData && tema) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Temaer', href: '/temaer' },
            { label: themeData.title }
          ]} />

          <h1>{themeData.title}</h1>

          <div className={styles.taggingSection}>
            <ItemTagging itemType="theme" itemId={tema} />
          </div>

          <ThemeVerseDisplay themeData={themeData} />
        </div>
      </div>
    );
  }

  // Old txt format
  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Temaer', href: '/temaer' },
          { label: displayName }
        ]} />

        <h1>{displayName}</h1>

        {tema && (
          <div className={styles.taggingSection}>
            <ItemTagging itemType="theme" itemId={tema} />
          </div>
        )}

        <div className={styles.themeItems}>
          {oldFormatItems.map((item, index) => (
            <div key={index} className={styles.themeItem}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
