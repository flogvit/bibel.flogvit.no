import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import styles from './OfflineIndicator.module.scss';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show nothing when online (unless just reconnected)
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`${styles.indicator} ${showReconnected ? styles.reconnected : styles.offline}`}
      role="status"
      aria-live="polite"
      title={showReconnected ? 'Tilkoblet igjen' : 'Frakoblet - kun nedlastet innhold tilgjengelig'}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>
        {showReconnected ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
