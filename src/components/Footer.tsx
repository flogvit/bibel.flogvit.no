import Link from 'next/link';
import styles from './Footer.module.scss';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.links} aria-label="Bunntekstnavigasjon">
          <Link href="/">Forside</Link>
          <Link href="/om">Om siden</Link>
          <Link href="/om#hjelp">Hjelp</Link>
          <Link href="/tilgjengelighet">Tilgjengelighet</Link>
        </nav>
        <p className={styles.copyright}>
          © {currentYear} bibel.flogvit.no
        </p>
      </div>
    </footer>
  );
}
