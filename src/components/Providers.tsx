'use client';

import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ReadingPlanProvider } from './ReadingPlanContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <ReadingPlanProvider>
          {children}
        </ReadingPlanProvider>
      </FavoritesProvider>
    </SettingsProvider>
  );
}
