'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';
import { TopicsProvider } from './TopicsContext';
import { NotesProvider } from './NotesContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <TopicsProvider>
          <NotesProvider>
            <ReadingPlanProvider>
              {children}
            </ReadingPlanProvider>
          </NotesProvider>
        </TopicsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
