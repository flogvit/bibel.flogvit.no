import { useState } from 'react';
import styles from './Footnotes.module.scss';

export interface Footnote {
  text: string;
  source?: string;
}

interface FootnotesProps {
  footnotes: Footnote[];
  defaultOpen?: boolean;
}

const sourceLabels: Record<string, string> = {
  rabbinsk: 'Rabbinsk',
  kabbalistisk: 'Kabbalistisk',
  lingvistisk: 'Lingvistisk',
  historisk: 'Historisk',
  arkeologisk: 'Arkeologisk',
  teologisk: 'Teologisk',
};

export function Footnotes({ footnotes, defaultOpen = false }: FootnotesProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (footnotes.length === 0) return null;

  return (
    <span className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${footnotes.length} fotnoter`}
        title={`${footnotes.length} fotnoter`}
      >
        *
      </button>
      {open && (
        <div className={styles.panel}>
          {footnotes.map((fn, i) => (
            <div key={i} className={styles.footnote}>
              {fn.source && (
                <span className={styles.source}>
                  {sourceLabels[fn.source] || fn.source}
                </span>
              )}
              <p>{fn.text}</p>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}
