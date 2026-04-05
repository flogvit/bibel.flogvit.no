

import { useSettings } from '@/components/SettingsContext';
import { ReactNode } from 'react';

interface ReadingModeWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ReadingModeWrapper({ children, className = '' }: ReadingModeWrapperProps) {
  const { settings } = useSettings();

  const modeClass = settings.layoutMode === 'reading'
    ? 'reading-mode'
    : settings.layoutMode === 'panel'
      ? 'panel-mode'
      : '';

  return (
    <div className={`${className} ${modeClass}`}>
      {children}
    </div>
  );
}
