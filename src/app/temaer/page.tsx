import styles from './page.module.scss';
import { getAllThemes, isJsonTheme, parseThemeJson } from '@/lib/bible';
import { ThemeList } from '@/components/ThemeList';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Tematiske bibelstudier - Bibelen',
  description: 'Tematiske bibelstudier og oversikter i Bibelen',
};

export default function ThemesPage() {
  const themes = getAllThemes();

  const themeList = themes.map((theme) => {
    if (isJsonTheme(theme.content)) {
      const data = parseThemeJson(theme.content);

      // Build searchable text from all content
      const searchParts: string[] = [];
      if (data) {
        searchParts.push(data.title);
        if (data.introduction) searchParts.push(data.introduction);
        for (const section of data.sections) {
          searchParts.push(section.title);
          if (section.description) searchParts.push(section.description);
        }
      }

      return {
        id: theme.id,
        name: theme.name,
        title: data?.title || theme.name,
        introduction: data?.introduction || 'Tematisk bibelstudie',
        searchText: searchParts.join(' '),
      };
    } else {
      // Old txt format
      const lines = theme.content.split('\n').filter(l => l.trim());
      const searchText = lines.map(line => {
        const colonIdx = line.indexOf(':');
        return colonIdx > 0 ? line.substring(0, colonIdx) : line;
      }).join(' ');

      return {
        id: theme.id,
        name: theme.name,
        title: theme.name.charAt(0).toUpperCase() + theme.name.slice(1),
        introduction: lines[0]?.split(':')[0] || '',
        searchText: theme.content,
      };
    }
  });

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Temaer' }
        ]} />

        <h1>Tematiske bibelstudier</h1>

        <ThemeList themes={themeList} />
      </div>
    </div>
  );
}
