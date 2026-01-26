

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'bible-verse-versions';

// Maps verse key (bookId-chapter-verse) to selected version index
type VerseVersionChoices = Record<string, number>;

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

function loadChoices(): VerseVersionChoices {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveChoices(choices: VerseVersionChoices): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
  } catch {
    // Ignore storage errors
  }
}

export function VerseVersionsProvider({ children }: { children: ReactNode }) {
  const [choices, setChoices] = useState<VerseVersionChoices>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setChoices(loadChoices());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveChoices(choices);
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
