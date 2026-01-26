'use client';

import Link from 'next/link';
import { useReadingPosition } from './ReadingPositionContext';
import styles from './ContinueReading.module.scss';

export function ContinueReading() {
  const { position, clearPosition } = useReadingPosition();

  if (!position) {
    return null;
  }

  const href = `/${position.bookSlug}/${position.chapter}#v${position.verse}`;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.label}>Fortsett lesing</span>
        <Link href={href} className={styles.link}>
          {position.bookName} {position.chapter}:{position.verse}
        </Link>
      </div>
      <button
        className={styles.closeButton}
        onClick={clearPosition}
        aria-label="Fjern leseposisjon"
        title="Fjern"
      >
        &times;
      </button>
    </div>
  );
}
