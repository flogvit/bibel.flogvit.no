'use client';

import { useEffect, useRef } from 'react';
import { useReadingPosition } from '@/components/ReadingPositionContext';

interface ReadingPositionTrackerProps {
  bookId: number;
  chapter: number;
  bookSlug: string;
  bookName: string;
}

export function ReadingPositionTracker({ bookId, chapter, bookSlug, bookName }: ReadingPositionTrackerProps) {
  const { updatePosition } = useReadingPosition();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Find all verse elements
    const verseElements = document.querySelectorAll('[id^="v"]');
    if (verseElements.length === 0) return;

    // Track visible verses
    const visibleVerses = new Map<number, Element>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const verseMatch = entry.target.id.match(/^v(\d+)$/);
          if (!verseMatch) return;

          const verseNum = parseInt(verseMatch[1]);

          if (entry.isIntersecting) {
            visibleVerses.set(verseNum, entry.target);
          } else {
            visibleVerses.delete(verseNum);
          }
        });

        // Find the topmost visible verse
        if (visibleVerses.size > 0) {
          const topVerse = Math.min(...visibleVerses.keys());
          updatePosition({
            bookId,
            chapter,
            verse: topVerse,
            bookSlug,
            bookName,
          });
        }
      },
      {
        // Detect verses in the upper 20% of viewport
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all verse elements
    verseElements.forEach((el) => {
      if (el.id.match(/^v\d+$/)) {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [bookId, chapter, bookSlug, bookName, updatePosition]);

  // This component renders nothing - it only tracks scroll position
  return null;
}
