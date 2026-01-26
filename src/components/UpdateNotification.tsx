

import { useState, useEffect, useCallback } from 'react';
import styles from './UpdateNotification.module.scss';

interface UpdateInfo {
  hasUpdate: boolean;
  serverVersion: string;
  cachedVersion: string | null;
  chaptersToRefresh: number;
  reason?: string;
}

interface RefreshProgress {
  current: number;
  total: number;
  refreshed: number;
  failed: number;
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) return;

    const messageChannel = new MessageChannel();

    return new Promise<UpdateInfo | null>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      registration.active!.postMessage(
        { type: 'CHECK_VERSION' },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => resolve(null), 10000);
    });
  }, []);

  // Refresh all cached chapters
  const refreshCache = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsRefreshing(true);
    setProgress(null);

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      setIsRefreshing(false);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      const result = event.data;
      if (result.success) {
        setRefreshComplete(true);
        setIsRefreshing(false);
        setUpdateInfo(null);
      } else {
        setIsRefreshing(false);
        console.error('Cache refresh failed:', result.error);
      }
    };

    registration.active.postMessage(
      { type: 'REFRESH_ALL_CACHED' },
      [messageChannel.port2]
    );
  }, []);

  // Listen for progress updates from Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      if (type === 'REFRESH_PROGRESS') {
        setProgress(payload);
      } else if (type === 'REFRESH_COMPLETE') {
        setRefreshComplete(true);
        setIsRefreshing(false);
        setProgress(null);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Check for updates on mount and when coming online
  useEffect(() => {
    const doCheck = async () => {
      const info = await checkForUpdates();
      if (info?.hasUpdate) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    };

    // Initial check (with delay to let SW initialize)
    const timeout = setTimeout(doCheck, 2000);

    // Check when coming online
    const handleOnline = () => {
      setTimeout(doCheck, 1000);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates]);

  // Auto-hide refresh complete message
  useEffect(() => {
    if (refreshComplete) {
      const timeout = setTimeout(() => {
        setRefreshComplete(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [refreshComplete]);

  // Show refresh complete message
  if (refreshComplete) {
    return (
      <div className={styles.notification}>
        <div className={styles.success}>
          <span className={styles.icon}>✓</span>
          <span>Offline-data er oppdatert!</span>
        </div>
      </div>
    );
  }

  // Show refreshing progress
  if (isRefreshing) {
    return (
      <div className={styles.notification}>
        <div className={styles.refreshing}>
          <span className={styles.spinner} />
          <div className={styles.progressInfo}>
            <span>Oppdaterer offline-data...</span>
            {progress && (
              <span className={styles.progressText}>
                {progress.current} av {progress.total} kapitler
              </span>
            )}
          </div>
        </div>
        {progress && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Show update available notification
  if (updateInfo?.hasUpdate && !dismissed) {
    return (
      <div className={styles.notification}>
        <div className={styles.content}>
          <span className={styles.icon}>↻</span>
          <div className={styles.message}>
            <span className={styles.title}>Bibeldataene er oppdatert</span>
            <span className={styles.subtitle}>
              {updateInfo.chaptersToRefresh} lagrede kapitler kan oppdateres
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.updateButton}
            onClick={refreshCache}
          >
            Oppdater nå
          </button>
          <button
            className={styles.dismissButton}
            onClick={() => setDismissed(true)}
          >
            Senere
          </button>
        </div>
      </div>
    );
  }

  return null;
}
