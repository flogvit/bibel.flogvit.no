'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/components/SettingsContext';
import styles from './ImportantWords.module.scss';

interface ImportantWord {
  word: string;
  explanation: string;
}

interface ImportantWordsProps {
  bookId: number;
  chapter: number;
}

export function ImportantWords({ bookId, chapter }: ImportantWordsProps) {
  const { settings } = useSettings();
  const [words, setWords] = useState<ImportantWord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (settings.showImportantWords && words === null && !loading) {
      setLoading(true);
      fetch(`/api/important-words?bookId=${bookId}&chapter=${chapter}`)
        .then(res => res.json())
        .then(data => {
          setWords(data);
          setLoading(false);
        })
        .catch(() => {
          setWords([]);
          setLoading(false);
        });
    }
  }, [settings.showImportantWords, bookId, chapter, words, loading]);

  // Hide in reading mode
  if (settings.readingMode || !settings.showImportantWords) {
    return null;
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <h2>Viktige ord</h2>
        <p className={styles.loading} role="status" aria-live="polite">Laster...</p>
      </section>
    );
  }

  if (!words || words.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <h2>Viktige ord i dette kapittelet</h2>
      <div className={styles.wordList}>
        {words.map((word, index) => (
          <div key={index} className={styles.wordItem}>
            <button
              className={styles.wordButton}
              onClick={() => setExpanded(expanded === index ? null : index)}
              aria-expanded={expanded === index}
              aria-controls={`word-explanation-${index}`}
            >
              <span className={styles.word}>{word.word}</span>
              <span className={styles.toggle} aria-hidden="true">{expanded === index ? '−' : '+'}</span>
            </button>
            {expanded === index && (
              <p id={`word-explanation-${index}`} className={styles.explanation}>{word.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
