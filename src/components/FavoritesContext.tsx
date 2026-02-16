

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getFavorites,
  saveFavorites,
  FavoriteVerse,
  migrateToIndexedDB,
} from '@/lib/offline/userData';
import { useSyncRefresh } from './SyncContext';

export type { FavoriteVerse };

interface FavoritesContextType {
  favorites: FavoriteVerse[];
  addFavorite: (verse: FavoriteVerse) => void;
  removeFavorite: (verse: FavoriteVerse) => void;
  isFavorite: (bookId: number, chapter: number, verse: number) => boolean;
  toggleFavorite: (verse: FavoriteVerse) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    async function loadData() {
      // Run migration first (will be skipped if already done)
      await migrateToIndexedDB();
      const data = await getFavorites();
      setFavorites(data);
      setLoaded(true);
    }
    loadData();
  }, []);

  // Save favorites when they change
  useEffect(() => {
    if (loaded) {
      saveFavorites(favorites);
    }
  }, [favorites, loaded]);

  // Refresh from storage after sync
  const refreshFromStorage = useCallback(async () => {
    const data = await getFavorites();
    setFavorites(data);
  }, []);
  useSyncRefresh(refreshFromStorage);

  const isFavorite = useCallback((bookId: number, chapter: number, verse: number): boolean => {
    return favorites.some(f => f.bookId === bookId && f.chapter === chapter && f.verse === verse);
  }, [favorites]);

  function addFavorite(verse: FavoriteVerse) {
    setFavorites(prev => {
      if (prev.some(f => f.bookId === verse.bookId && f.chapter === verse.chapter && f.verse === verse.verse)) {
        return prev;
      }
      return [...prev, verse];
    });
  }

  function removeFavorite(verse: FavoriteVerse) {
    setFavorites(prev =>
      prev.filter(f => !(f.bookId === verse.bookId && f.chapter === verse.chapter && f.verse === verse.verse))
    );
  }

  function toggleFavorite(verse: FavoriteVerse) {
    if (isFavorite(verse.bookId, verse.chapter, verse.verse)) {
      removeFavorite(verse);
    } else {
      addFavorite(verse);
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
