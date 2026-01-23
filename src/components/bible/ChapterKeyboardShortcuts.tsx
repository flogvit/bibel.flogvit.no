'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ChapterKeyboardShortcutsProps {
  bookSlug: string;
  currentChapter: number;
  maxChapter: number;
  nextBookSlug?: string | null;
  bibleQuery?: string;
}

export function ChapterKeyboardShortcuts({
  bookSlug,
  currentChapter,
  maxChapter,
  nextBookSlug,
  bibleQuery = '',
}: ChapterKeyboardShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when typing in input fields
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          activeElement.getAttribute('contenteditable') === 'true'
        ) {
          return;
        }
      }

      // Arrow key navigation for chapters
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (currentChapter > 1) {
          router.push(`/${bookSlug}/${currentChapter - 1}${bibleQuery}`);
        }
        return;
      }

      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (currentChapter < maxChapter) {
          router.push(`/${bookSlug}/${currentChapter + 1}${bibleQuery}`);
        } else if (nextBookSlug) {
          router.push(`/${nextBookSlug}/1${bibleQuery}`);
        }
        return;
      }

      // Number keys 1-9 to jump to verse
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        const verseElement = document.getElementById(`v${e.key}`);
        if (verseElement) {
          e.preventDefault();
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.history.replaceState(null, '', `#v${e.key}`);
        }
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bookSlug, currentChapter, maxChapter, nextBookSlug, bibleQuery, router]);

  // This component doesn't render anything - it just adds keyboard handlers
  return null;
}
