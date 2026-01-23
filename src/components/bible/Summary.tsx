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
      <h3>{title}</h3>
      <Markdown>{content}</Markdown>
    </section>
  );
}
