

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';
import { TopicsProvider } from './TopicsContext';
import { NotesProvider } from './NotesContext';
import { DevotionalsProvider } from './DevotionalsContext';
import { VerseVersionsProvider } from './VerseVersionsContext';
import { ReadingPositionProvider } from './ReadingPositionContext';
import { SyncProvider } from './SyncContext';
import { ServiceWorkerProvider } from './ServiceWorkerProvider';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdateNotification } from './UpdateNotification';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FavoritesProvider>
          <TopicsProvider>
            <NotesProvider>
              <DevotionalsProvider>
              <VerseVersionsProvider>
                <ReadingPositionProvider>
                  <ReadingPlanProvider>
                    <SyncProvider>
                      {children}
                      <ServiceWorkerProvider />
                      <OfflineIndicator />
                      <UpdateNotification />
                    </SyncProvider>
                  </ReadingPlanProvider>
                </ReadingPositionProvider>
              </VerseVersionsProvider>
              </DevotionalsProvider>
            </NotesProvider>
          </TopicsProvider>
        </FavoritesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
