import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.links} aria-label="Bunntekstnavigasjon">
          <Link to="/">Forside</Link>
          <Link to="/om">Om siden</Link>
          <Link to="/om#hjelp">Hjelp</Link>
          <Link to="/innstillinger">Innstillinger</Link>
          <Link to="/offline">Offline</Link>
          <Link to="/tilgjengelighet">Tilgjengelighet</Link>
        </nav>
      </div>
    </footer>
  );
}
