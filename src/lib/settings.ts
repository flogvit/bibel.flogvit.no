export type FontSize = 'small' | 'medium' | 'large';
export type BibleVersion = 'osnb1' | 'osnn1';

export const bibleVersions: { value: BibleVersion; label: string }[] = [
  { value: 'osnb1', label: 'Bokmål' },
  { value: 'osnn1', label: 'Nynorsk' },
];

export interface BibleSettings {
  showBookSummary: boolean;
  showChapterSummary: boolean;
  showImportantWords: boolean;
  showWord4Word: boolean;
  showReferences: boolean;
  showOriginalText: boolean;
  fontSize: FontSize;
  darkMode: boolean;
  bible: BibleVersion;
}

export const defaultSettings: BibleSettings = {
  showBookSummary: true,
  showChapterSummary: true,
  showImportantWords: false,
  showWord4Word: true,
  showReferences: true,
  showOriginalText: false,
  fontSize: 'medium',
  darkMode: false,
  bible: 'osnb1',
};

const STORAGE_KEY = 'bible-settings';

export function loadSettings(): BibleSettings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: BibleSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
