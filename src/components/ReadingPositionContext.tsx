

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  ReadingPosition,
  getReadingPosition,
  saveReadingPosition,
} from '@/lib/offline/userData';

export type { ReadingPosition };

const STORAGE_KEY = 'bible-reading-position';
const DEBOUNCE_MS = 500;

interface ReadingPositionContextType {
  position: ReadingPosition | null;
  updatePosition: (position: Omit<ReadingPosition, 'timestamp'>) => void;
  clearPosition: () => void;
}

const ReadingPositionContext = createContext<ReadingPositionContextType | null>(null);

// Sync load for initial render (avoids hydration issues)
function loadPositionSync(): ReadingPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function ReadingPositionProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage synchronously on mount, then try IndexedDB
  useEffect(() => {
    // First, load from localStorage for immediate display
    const syncPosition = loadPositionSync();
    setPosition(syncPosition);
    setLoaded(true);

    // Then try to load from IndexedDB (may have newer data)
    getReadingPosition().then(idbPosition => {
      if (idbPosition) {
        // Use IndexedDB data if it's newer
        if (!syncPosition || idbPosition.timestamp > syncPosition.timestamp) {
          setPosition(idbPosition);
        }
      }
    });
  }, []);

  // Save to both localStorage and IndexedDB when position changes
  useEffect(() => {
    if (loaded) {
      saveReadingPosition(position);
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
