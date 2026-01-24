'use client';

import { useSettings } from '@/components/SettingsContext';
import { ReactNode } from 'react';

interface ReadingModeWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ReadingModeWrapper({ children, className = '' }: ReadingModeWrapperProps) {
  const { settings } = useSettings();

  return (
    <div className={`${className} ${settings.readingMode ? 'reading-mode' : ''}`}>
      {children}
    </div>
  );
}
