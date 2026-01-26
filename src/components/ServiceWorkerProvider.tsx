

import { useEffect, useState } from 'react';
import { registerServiceWorker, skipWaiting } from '@/lib/offline/register-sw';
import styles from './ServiceWorkerProvider.module.scss';

export function ServiceWorkerProvider() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Listen for update events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = () => {
    skipWaiting();
    setUpdateAvailable(false);
    // Reload the page to activate new service worker
    window.location.reload();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className={styles.updateBanner} role="alert">
      <span className={styles.message}>
        En ny versjon av appen er tilgjengelig.
      </span>
      <div className={styles.actions}>
        <button className={styles.updateButton} onClick={handleUpdate}>
          Oppdater nå
        </button>
        <button className={styles.dismissButton} onClick={handleDismiss}>
          Senere
        </button>
      </div>
    </div>
  );
}
