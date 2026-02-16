import { useState } from 'react';
import { performSync } from '@/lib/sync/syncService';
import styles from './InitialSyncDialog.module.scss';

interface InitialSyncDialogProps {
  onComplete: () => void;
}

export function InitialSyncDialog({ onComplete }: InitialSyncDialogProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync(fullSync: boolean) {
    setSyncing(true);
    setError(null);
    try {
      await performSync(fullSync);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synkronisering feilet');
      setSyncing(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2>Synkroniser data</h2>
        <p>
          Du er nå logget inn. Vil du laste opp dine lokale data til skyen,
          eller hente data som allerede er lagret?
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={() => handleSync(true)}
            disabled={syncing}
          >
            {syncing ? 'Synkroniserer...' : 'Last opp og synkroniser'}
          </button>
          <button
            className={styles.secondaryButton}
            onClick={onComplete}
            disabled={syncing}
          >
            Hopp over
          </button>
        </div>
      </div>
    </div>
  );
}
