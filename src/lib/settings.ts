export type FontSize = 'small' | 'medium' | 'large';
export type BibleVersion = 'osnb1' | 'osnb2' | 'osnn1';

export const bibleVersions: { value: BibleVersion; label: string }[] = [
  { value: 'osnb1', label: 'Bokmål' },
  { value: 'osnb2', label: 'Bokmål 2' },
  { value: 'osnn1', label: 'Nynorsk' },
];

export interface BibleSettings {
  showBookSummary: boolean;
  showChapterSummary: boolean;
  showChapterContext: boolean;
  showChapterInsights: boolean;
  showImportantWords: boolean;
  showWord4Word: boolean;
  showVerseDetails: boolean;
  showVerseIndicators: boolean;
  showOriginalText: boolean;
  showTimeline: boolean;
  readingMode: boolean;
  fontSize: FontSize;
  darkMode: boolean;
  bible: BibleVersion;
}

export const defaultSettings: BibleSettings = {
  showBookSummary: true,
  showChapterSummary: true,
  showChapterContext: false,
  showChapterInsights: true,
  showImportantWords: false,
  showWord4Word: true,
  showVerseDetails: true,
  showVerseIndicators: false,
  showOriginalText: false,
  showTimeline: true,
  readingMode: false,
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
