import Link from 'next/link';
import styles from './Footer.module.scss';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <Link href="/">Forside</Link>
          <Link href="/om">Om siden</Link>
        </div>
        <p className={styles.copyright}>
          © {currentYear} bibel.flogvit.com
        </p>
      </div>
    </footer>
  );
}
