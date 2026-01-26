

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

const STORAGE_KEY = 'bible-reading-position';
const DEBOUNCE_MS = 500;

export interface ReadingPosition {
  bookId: number;
  chapter: number;
  verse: number;
  timestamp: number;
  bookSlug: string;
  bookName: string;
}

interface ReadingPositionContextType {
  position: ReadingPosition | null;
  updatePosition: (position: Omit<ReadingPosition, 'timestamp'>) => void;
  clearPosition: () => void;
}

const ReadingPositionContext = createContext<ReadingPositionContextType | null>(null);

function loadPosition(): ReadingPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function savePosition(position: ReadingPosition | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (position) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function ReadingPositionProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPosition(loadPosition());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      savePosition(position);
    }
  }, [position, loaded]);

  const updatePosition = useCallback((newPos: Omit<ReadingPosition, 'timestamp'>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setPosition({
        ...newPos,
        timestamp: Date.now(),
      });
    }, DEBOUNCE_MS);
  }, []);

  const clearPosition = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setPosition(null);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <ReadingPositionContext.Provider value={{ position, updatePosition, clearPosition }}>
      {children}
    </ReadingPositionContext.Provider>
  );
}

export function useReadingPosition() {
  const context = useContext(ReadingPositionContext);
  if (!context) {
    throw new Error('useReadingPosition must be used within ReadingPositionProvider');
  }
  return context;
}
