'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './LoadingIndicator.module.scss';

export function LoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  // Track navigation changes
  useEffect(() => {
    setIsLoading(false);
    setShowLoader(false);
  }, [pathname, searchParams]);

  // Show loader only after a delay (200ms) to avoid flashing for fast loads
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoader(true);
      }, 200);
    } else {
      setShowLoader(false);
    }

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Listen for click events on links to detect navigation start
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const url = new URL(link.href);
        // Only show loader for internal navigation
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          setIsLoading(true);
        }
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  // Also track pending transitions (for form submissions, etc.)
  useEffect(() => {
    if (isPending) {
      setIsLoading(true);
    }
  }, [isPending]);

  if (!showLoader) return null;

  return (
    <span className={styles.loader} aria-label="Laster..." role="status">
      <span className={styles.spinner} />
    </span>
  );
}
