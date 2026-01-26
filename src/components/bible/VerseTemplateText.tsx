import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseVerseTemplate, type VerseTemplate } from '@/lib/verse-template';
import styles from './VerseTemplateText.module.scss';

interface VerseResult {
  refString: string;
  text: string;
  url: string;
  formattedRef: string;
}

interface VerseTemplateTextProps {
  text: string;
  className?: string;
}

export function VerseTemplateText({ text, className }: VerseTemplateTextProps) {
  const [verses, setVerses] = useState<Record<string, VerseResult>>({});
  const [loading, setLoading] = useState(false);

  // Parse template parts
  const parts = parseVerseTemplate(text);
  const verseRefs = parts
    .filter((p): p is VerseTemplate & { refString: string } =>
      p.type === 'verse' && p.refString !== undefined
    )
    .map(p => p.refString);

  useEffect(() => {
    if (verseRefs.length === 0) return;

    setLoading(true);

    fetch('/api/verse-refs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refs: verseRefs }),
    })
      .then(res => res.json())
      .then(data => {
        setVerses(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch verses:', error);
        setLoading(false);
      });
  }, [text]);

  // No templates - just return plain text
  if (verseRefs.length === 0) {
    return <span className={className}>{text}</span>;
  }

  if (loading) {
    return <span className={className}>{text.replace(/\{\{[^}]+\}\}/g, '...')}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        }

        if (part.type === 'verse' && part.refString) {
          const verseData = verses[part.refString];

          if (!verseData) {
            return <span key={index} className={styles.missing}>[{part.content}]</span>;
          }

          return (
            <Link
              key={index}
              to={verseData.url}
              className={styles.verseLink}
              title={verseData.formattedRef}
            >
              {verseData.text}
            </Link>
          );
        }

        return null;
      })}
    </span>
  );
}
