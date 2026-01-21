'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'bible-favorites';

export interface FavoriteVerse {
  bookId: number;
  chapter: number;
  verse: number;
}

interface FavoritesContextType {
  favorites: FavoriteVerse[];
  addFavorite: (verse: FavoriteVerse) => void;
  removeFavorite: (verse: FavoriteVerse) => void;
  isFavorite: (bookId: number, chapter: number, verse: number) => boolean;
  toggleFavorite: (verse: FavoriteVerse) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

function loadFavorites(): FavoriteVerse[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteVerse[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage errors
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveFavorites(favorites);
    }
  }, [favorites, loaded]);

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

  function isFavorite(bookId: number, chapter: number, verse: number): boolean {
    return favorites.some(f => f.bookId === bookId && f.chapter === chapter && f.verse === verse);
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
