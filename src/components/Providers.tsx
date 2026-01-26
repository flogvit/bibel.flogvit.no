

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';
import { TopicsProvider } from './TopicsContext';
import { NotesProvider } from './NotesContext';
import { VerseVersionsProvider } from './VerseVersionsContext';
import { ReadingPositionProvider } from './ReadingPositionContext';
import { ServiceWorkerProvider } from './ServiceWorkerProvider';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdateNotification } from './UpdateNotification';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <TopicsProvider>
          <NotesProvider>
            <VerseVersionsProvider>
              <ReadingPositionProvider>
                <ReadingPlanProvider>
                  {children}
                  <ServiceWorkerProvider />
                  <OfflineIndicator />
                  <UpdateNotification />
                </ReadingPlanProvider>
              </ReadingPositionProvider>
            </VerseVersionsProvider>
          </NotesProvider>
        </TopicsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
