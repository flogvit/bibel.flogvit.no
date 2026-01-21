import styles from './page.module.scss';
import Link from 'next/link';
import { getAllThemes } from '@/lib/bible';

export const metadata = {
  title: 'Tematiske oversikter - Bibelen',
  description: 'Tematiske oversikter og studier i Bibelen',
};

const themeDisplayNames: Record<string, string> = {
  evangeliene: 'Evangeliene',
};

export default function ThemesPage() {
  const themes = getAllThemes();

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/" className={styles.backLink}>← Tilbake til Bibelen</Link>

        <h1>Tematiske oversikter</h1>

        {themes.length === 0 ? (
          <p className={styles.noThemes}>Ingen temaer tilgjengelig ennå.</p>
        ) : (
          <div className={styles.themeList}>
            {themes.map((theme) => (
              <Link
                key={theme.id}
                href={`/temaer/${theme.name}`}
                className={styles.themeCard}
              >
                <h2>{themeDisplayNames[theme.name] || theme.name}</h2>
                <p className={styles.themePreview}>
                  {theme.content.split('\n')[0].split(':')[0]}...
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
