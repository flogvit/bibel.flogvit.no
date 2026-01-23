import styles from './page.module.scss';
import { notFound } from 'next/navigation';
import { getThemeByName, parseThemeContent, getAllThemes, isJsonTheme, parseThemeJson } from '@/lib/bible';
import { ThemeVerseDisplay } from '@/components/bible/ThemeVerseDisplay';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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
  const theme = getThemeByName(tema);

  if (!theme) {
    return { title: 'Tema ikke funnet' };
  }

  if (isJsonTheme(theme.content)) {
    const data = parseThemeJson(theme.content);
    return {
      title: `${data?.title || tema} - Tematiske bibelstudier`,
      description: data?.introduction?.slice(0, 160) || `Tematisk bibelstudie om ${tema}`,
    };
  }

  return {
    title: `${tema.charAt(0).toUpperCase() + tema.slice(1)} - Tematiske bibelstudier`,
    description: `Tematisk oversikt over ${tema.toLowerCase()} i Bibelen`,
  };
}

export default async function ThemePage({ params }: Props) {
  const { tema } = await params;
  const theme = getThemeByName(tema);

  if (!theme) {
    notFound();
  }

  // Sjekk om det er nytt JSON-format
  if (isJsonTheme(theme.content)) {
    const themeData = parseThemeJson(theme.content);

    if (!themeData) {
      notFound();
    }

    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Temaer', href: '/temaer' },
            { label: themeData.title }
          ]} />

          <h1>{themeData.title}</h1>

          <ThemeVerseDisplay themeData={themeData} />
        </div>
      </div>
    );
  }

  // Gammelt txt-format
  const items = parseThemeContent(theme.content);
  const displayName = tema.charAt(0).toUpperCase() + tema.slice(1);

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Temaer', href: '/temaer' },
          { label: displayName }
        ]} />

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
    </div>
  );
}
