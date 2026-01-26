import { Link } from 'react-router-dom';
import { booksData } from '@/lib/books-data';
import { ContinueReading } from '@/components/ContinueReading';
import { TodaysReading } from '@/components/TodaysReading';
import styles from '@/styles/pages/home.module.scss';

function toUrlSlug(shortName: string): string {
  return shortName.toLowerCase();
}

export function HomeContent() {
  const otBooks = booksData.filter(b => b.testament === 'OT');
  const ntBooks = booksData.filter(b => b.testament === 'NT');

  return (
    <div className={styles.main}>
      <div className="container">
        <header className={styles.header}>
          <h1>Bibelen</h1>
          <p className="text-muted">Velg en bok for å begynne å lese</p>
        </header>

        <ContinueReading />
        <TodaysReading />

        <section className={styles.testament}>
          <h2>Det gamle testamente</h2>
          <div className={styles.bookGrid}>
            {otBooks.map(book => (
              <Link
                key={book.id}
                to={`/${toUrlSlug(book.short_name)}/1`}
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
                to={`/${toUrlSlug(book.short_name)}/1`}
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
