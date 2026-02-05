

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  VerseVersionChoices,
  getVerseVersions,
  saveVerseVersions,
} from '@/lib/offline/userData';

const STORAGE_KEY = 'bible-verse-versions';

interface VerseVersionsContextType {
  choices: VerseVersionChoices;
  getSelectedVersion: (bookId: number, chapter: number, verse: number) => number | undefined;
  setSelectedVersion: (bookId: number, chapter: number, verse: number, versionIndex: number) => void;
  clearSelectedVersion: (bookId: number, chapter: number, verse: number) => void;
}

const VerseVersionsContext = createContext<VerseVersionsContextType | null>(null);

function makeKey(bookId: number, chapter: number, verse: number): string {
  return `${bookId}-${chapter}-${verse}`;
}

// Sync load for initial render (avoids hydration issues)
function loadChoicesSync(): VerseVersionChoices {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function VerseVersionsProvider({ children }: { children: ReactNode }) {
  const [choices, setChoices] = useState<VerseVersionChoices>({});
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage synchronously on mount, then try IndexedDB
  useEffect(() => {
    // First, load from localStorage for immediate display
    const syncChoices = loadChoicesSync();
    setChoices(syncChoices);
    setLoaded(true);

    // Then try to load from IndexedDB (may have more data)
    getVerseVersions().then(idbChoices => {
      if (idbChoices && Object.keys(idbChoices).length > 0) {
        // Merge IndexedDB data with localStorage data
        // IndexedDB takes precedence for conflicts
        setChoices(prev => ({ ...prev, ...idbChoices }));
      }
    });
  }, []);

  // Save to both localStorage and IndexedDB when choices change
  useEffect(() => {
    if (loaded) {
      saveVerseVersions(choices);
    }
  }, [choices, loaded]);

  function getSelectedVersion(bookId: number, chapter: number, verse: number): number | undefined {
    const key = makeKey(bookId, chapter, verse);
    return choices[key];
  }

  function setSelectedVersion(bookId: number, chapter: number, verse: number, versionIndex: number): void {
    const key = makeKey(bookId, chapter, verse);
    setChoices(prev => ({ ...prev, [key]: versionIndex }));
  }

  function clearSelectedVersion(bookId: number, chapter: number, verse: number): void {
    const key = makeKey(bookId, chapter, verse);
    setChoices(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <VerseVersionsContext.Provider value={{ choices, getSelectedVersion, setSelectedVersion, clearSelectedVersion }}>
      {children}
    </VerseVersionsContext.Provider>
  );
}

export function useVerseVersions() {
  const context = useContext(VerseVersionsContext);
  if (!context) {
    throw new Error('useVerseVersions must be used within VerseVersionsProvider');
  }
  return context;
}
