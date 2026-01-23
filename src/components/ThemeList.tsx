'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from '@/app/temaer/page.module.scss';

interface ThemeListItem {
  id: number;
  name: string;
  title: string;
  introduction: string;
  searchText: string; // All searchable text combined
}

interface ThemeListProps {
  themes: ThemeListItem[];
}

export function ThemeList({ themes }: ThemeListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThemes = useMemo(() => {
    if (!searchQuery.trim()) {
      return themes;
    }

    const query = searchQuery.toLowerCase().trim();
    const words = query.split(/\s+/);

    return themes
      .map(theme => {
        // Calculate match score
        let score = 0;
        const titleLower = theme.title.toLowerCase();
        const searchTextLower = theme.searchText.toLowerCase();

        // Exact title match = highest priority
        if (titleLower === query) {
          score += 100;
        }
        // Title starts with query
        else if (titleLower.startsWith(query)) {
          score += 50;
        }
        // Title contains query
        else if (titleLower.includes(query)) {
          score += 30;
        }

        // Check each word
        for (const word of words) {
          if (word.length < 2) continue;

          if (titleLower.includes(word)) {
            score += 20;
          }
          if (searchTextLower.includes(word)) {
            score += 5;
          }
        }

        return { theme, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.theme);
  }, [themes, searchQuery]);

  return (
    <>
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Søk i temaer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Søk i bibelske temaer"
        />
        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={() => setSearchQuery('')}
            aria-label="Tøm søk"
          >
            ×
          </button>
        )}
      </div>

      {searchQuery && (
        <p className={styles.searchInfo}>
          {filteredThemes.length} {filteredThemes.length === 1 ? 'tema' : 'temaer'} funnet
        </p>
      )}

      {filteredThemes.length === 0 ? (
        <p className={styles.noThemes}>
          {searchQuery ? 'Ingen temaer matcher søket.' : 'Ingen temaer tilgjengelig ennå.'}
        </p>
      ) : (
        <div className={styles.themeList}>
          {filteredThemes.map((theme) => (
            <Link
              key={theme.id}
              href={`/temaer/${theme.name}`}
              className={styles.themeCard}
            >
              <h2>{theme.title}</h2>
              <p className={styles.themePreview}>
                {theme.introduction.slice(0, 150)}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
