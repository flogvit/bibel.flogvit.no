'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';
import { TopicsProvider } from './TopicsContext';
import { NotesProvider } from './NotesContext';
import { VerseVersionsProvider } from './VerseVersionsContext';
import { ReadingPositionProvider } from './ReadingPositionContext';

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
                </ReadingPlanProvider>
              </ReadingPositionProvider>
            </VerseVersionsProvider>
          </NotesProvider>
        </TopicsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
