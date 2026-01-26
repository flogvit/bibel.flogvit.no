/**
 * Settings module
 *
 * This file re-exports settings types and functions from the offline userData module
 * for backwards compatibility. New code should import directly from '@/lib/offline/userData'.
 */

// Re-export types and functions from userData
export {
  type FontSize,
  type BibleVersion,
  type BibleSettings,
  defaultSettings,
  getSettings as loadSettings,
  saveSettings,
} from './offline/userData';

// Bible version options
export const bibleVersions: { value: 'osnb2' | 'osnn1'; label: string }[] = [
  { value: 'osnb2', label: 'Bokmål' },
  { value: 'osnn1', label: 'Nynorsk' },
];

// Synchronous versions for server-side usage or initial render
// These use localStorage directly for immediate access
export function loadSettingsSync(): import('./offline/userData').BibleSettings {
  const { defaultSettings } = require('./offline/userData');

  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem('bible-settings');
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
}

export function saveSettingsSync(settings: import('./offline/userData').BibleSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('bible-settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
