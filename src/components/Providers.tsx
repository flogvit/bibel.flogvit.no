'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';
import { TopicsProvider } from './TopicsContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <TopicsProvider>
          <ReadingPlanProvider>
            {children}
          </ReadingPlanProvider>
        </TopicsProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
