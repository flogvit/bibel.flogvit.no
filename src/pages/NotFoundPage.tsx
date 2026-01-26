import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="reading-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>404 - Siden finnes ikke</h1>
      <p>Beklager, vi finner ikke siden du leter etter.</p>
      <Link to="/" style={{ color: 'var(--color-secondary)' }}>
        Gå til forsiden
      </Link>
    </div>
  );
}
