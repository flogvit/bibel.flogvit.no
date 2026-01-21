import styles from './page.module.scss';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getThemeByName, parseThemeContent, getAllThemes } from '@/lib/bible';

const themeDisplayNames: Record<string, string> = {
  evangeliene: 'Evangeliene',
};

interface Props {
  params: Promise<{ tema: string }>;
}

export async function generateStaticParams() {
  const themes = getAllThemes();
  return themes.map((theme) => ({
    tema: theme.name,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { tema } = await params;
  const displayName = themeDisplayNames[tema] || tema;
  return {
    title: `${displayName} - Tematiske oversikter - Bibelen`,
    description: `Tematisk oversikt over ${displayName.toLowerCase()} i Bibelen`,
  };
}

export default async function ThemePage({ params }: Props) {
  const { tema } = await params;
  const theme = getThemeByName(tema);

  if (!theme) {
    notFound();
  }

  const items = parseThemeContent(theme.content);
  const displayName = themeDisplayNames[tema] || tema;

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/temaer" className={styles.backLink}>← Tilbake til temaer</Link>

        <h1>{displayName}</h1>

        <div className={styles.themeItems}>
          {items.map((item, index) => (
            <div key={index} className={styles.themeItem}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
