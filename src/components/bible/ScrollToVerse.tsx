'use client';

import { useEffect } from 'react';

export function ScrollToVerse() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('verse-highlight');
          setTimeout(() => {
            element.classList.remove('verse-highlight');
          }, 2000);
        }
      }, 100);
    }
  }, []);

  return null;
}
