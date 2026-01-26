import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Announces page navigation to screen readers and manages focus for SPA navigation.
 * WCAG 2.4.3: Focus Order - Ensure focus moves logically after navigation
 */
export function NavigationAnnouncer() {
  const location = useLocation();
  const pathname = location.pathname;
  const previousPathname = useRef(pathname);
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only announce if the path actually changed
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;

      // Wait for the new content to render
      requestAnimationFrame(() => {
        // Find the main heading or use a generic message
        const heading = document.querySelector('h1');
        const pageTitle = heading?.textContent || document.title || 'Ny side lastet';

        // Announce to screen readers
        if (announcerRef.current) {
          announcerRef.current.textContent = `Navigerte til: ${pageTitle}`;
        }

        // Move focus to main content for keyboard users
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          // Make main focusable temporarily
          mainContent.setAttribute('tabindex', '-1');
          mainContent.focus({ preventScroll: true });

          // Remove tabindex after focus to avoid tab stop
          mainContent.addEventListener('blur', () => {
            mainContent.removeAttribute('tabindex');
          }, { once: true });
        }
      });
    }
  }, [pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
