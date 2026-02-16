import { useAuth } from '@/components/AuthContext';
import { useSync, SyncStatus } from '@/components/SyncContext';
import styles from './SyncStatusIndicator.module.scss';

const statusIcons: Record<SyncStatus, string> = {
  idle: '\u2713',      // checkmark
  syncing: '\u21BB',   // clockwise arrows
  error: '!',
  offline: '\u2298',   // circled minus
};

const statusTitles: Record<SyncStatus, string> = {
  idle: 'Synkronisert',
  syncing: 'Synkroniserer...',
  error: 'Synkronisering feilet',
  offline: 'Frakoblet',
};

export function SyncStatusIndicator() {
  const { isAuthenticated } = useAuth();
  const { status, syncNow } = useSync();

  if (!isAuthenticated) return null;

  return (
    <button
      className={`${styles.indicator} ${styles[status]}`}
      onClick={() => syncNow()}
      title={statusTitles[status]}
      aria-label={statusTitles[status]}
    >
      <span className={status === 'syncing' ? styles.spinning : ''}>
        {statusIcons[status]}
      </span>
    </button>
  );
}
