import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.links} aria-label="Bunntekstnavigasjon">
          <Link to="/">Forside</Link>
          <Link to="/om">Om siden</Link>
          <Link to="/om#hjelp">Hjelp</Link>
          <Link to="/offline">Offline</Link>
          <Link to="/tilgjengelighet">Tilgjengelighet</Link>
        </nav>
        <p className={styles.copyright}>
          © {currentYear} bibel.flogvit.no
        </p>
      </div>
    </footer>
  );
}
