import { getAllBooks, toUrlSlug, Book } from '@/lib/bible';
import styles from './page.module.scss';
import Link from 'next/link';
import { TodaysReading } from '@/components/TodaysReading';

export default function Home() {
  const books = getAllBooks();
  const otBooks = books.filter(b => b.testament === 'OT');
  const ntBooks = books.filter(b => b.testament === 'NT');

  return (
    <div className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <h1>Bibelen</h1>
          <p className="text-muted">Velg en bok for å begynne å lese</p>
        </header>

        <TodaysReading />

        <section className={styles.testament}>
          <h2>Det gamle testamente</h2>
          <div className={styles.bookGrid}>
            {otBooks.map(book => (
              <Link
                key={book.id}
                href={`/${toUrlSlug(book.short_name)}/1`}
                className={styles.bookCard}
              >
                <span className={styles.bookName}>{book.name_no}</span>
                <span className={styles.chapters}>{book.chapters} kapitler</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.testament}>
          <h2>Det nye testamente</h2>
          <div className={styles.bookGrid}>
            {ntBooks.map(book => (
              <Link
                key={book.id}
                href={`/${toUrlSlug(book.short_name)}/1`}
                className={styles.bookCard}
              >
                <span className={styles.bookName}>{book.name_no}</span>
                <span className={styles.chapters}>{book.chapters} kapitler</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
