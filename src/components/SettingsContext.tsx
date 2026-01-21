'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BibleSettings, defaultSettings, loadSettings, saveSettings } from '@/lib/settings';

interface SettingsContextType {
  settings: BibleSettings;
  updateSetting: <K extends keyof BibleSettings>(key: K, value: BibleSettings[K]) => void;
  toggleSetting: (key: keyof BibleSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BibleSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveSettings(settings);
    }
  }, [settings, loaded]);

  // Apply font size and dark mode to document
  useEffect(() => {
    if (!loaded) return;

    // Font size
    document.documentElement.dataset.fontSize = settings.fontSize;

    // Dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.fontSize, settings.darkMode, loaded]);

  function updateSetting<K extends keyof BibleSettings>(key: K, value: BibleSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toggleSetting(key: keyof BibleSettings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
