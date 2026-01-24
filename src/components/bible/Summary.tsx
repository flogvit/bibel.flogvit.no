'use client';

import { useSettings } from '@/components/SettingsContext';
import Markdown from 'react-markdown';
import styles from './Summary.module.scss';

interface SummaryProps {
  type: 'book' | 'chapter' | 'context';
  title: string;
  content: string;
}

export function Summary({ type, title, content }: SummaryProps) {
  const { settings } = useSettings();

  // Hide in reading mode
  if (settings.readingMode) {
    return null;
  }

  const isVisible = type === 'book'
    ? settings.showBookSummary
    : type === 'context'
    ? settings.showChapterContext
    : settings.showChapterSummary;

  if (!isVisible) {
    return null;
  }

  return (
    <section className={styles.summary}>
      <h2>{title}</h2>
      <Markdown>{content}</Markdown>
    </section>
  );
}
