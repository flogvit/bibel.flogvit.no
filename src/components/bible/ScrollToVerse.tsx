import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToVerse() {
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          // Use 'start' to position verse at top of viewport
          // This matches how ReadingPositionTracker saves the topmost visible verse
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Add highlight effect
          element.classList.add('verse-highlight');
          setTimeout(() => {
            element.classList.remove('verse-highlight');
          }, 2000);
        }
      }, 100);
    } else {
      // No hash - scroll to top of page on navigation
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.hash]);

  return null;
}
