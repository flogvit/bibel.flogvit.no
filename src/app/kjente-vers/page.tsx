import Link from 'next/link';
import { getAllWellKnownVerses, toUrlSlug } from '@/lib/bible';
import styles from './page.module.scss';

export const metadata = {
  title: 'Kjente bibelvers - Bibelen',
  description: 'En samling av kjente og ofte siterte bibelvers',
};

export default function WellKnownVersesPage() {
  const verses = getAllWellKnownVerses();

  // Group by testament
  const otVerses = verses.filter(v => v.book_id <= 39);
  const ntVerses = verses.filter(v => v.book_id >= 40);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>← Tilbake</Link>
          <h1>Kjente bibelvers</h1>
          <p className={styles.intro}>
            En samling av kjente og ofte siterte bibelvers. Klikk på et vers for å lese det i kontekst.
          </p>
        </header>

        <section className={styles.section}>
          <h2>Det nye testamente ({ntVerses.length} vers)</h2>
          <div className={styles.verseList}>
            {ntVerses.map((verse, index) => (
              <Link
                key={`nt-${index}`}
                href={`/${toUrlSlug(verse.book_short_name)}/${verse.chapter}#v${verse.verse}`}
                className={styles.verseCard}
              >
                <span className={styles.reference}>
                  {verse.book_name_no} {verse.chapter}:{verse.verse}
                </span>
                <p className={styles.text}>{verse.verse_text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Det gamle testamente ({otVerses.length} vers)</h2>
          <div className={styles.verseList}>
            {otVerses.map((verse, index) => (
              <Link
                key={`ot-${index}`}
                href={`/${toUrlSlug(verse.book_short_name)}/${verse.chapter}#v${verse.verse}`}
                className={styles.verseCard}
              >
                <span className={styles.reference}>
                  {verse.book_name_no} {verse.chapter}:{verse.verse}
                </span>
                <p className={styles.text}>{verse.verse_text}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
