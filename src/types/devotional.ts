export type DevotionalType = 'andakt' | 'preken' | 'bibeltime' | 'refleksjon' | 'studie' | 'bonn' | 'undervisning';

export interface DevotionalPresentation {
  id: string;
  date: string;        // ISO date
  location?: string;
  event?: string;
  notes?: string;
}

export interface DevotionalVersion {
  id: string;
  name: string;        // Empty for draft, user-given for locked
  content: string;
  createdAt: number;
  locked: boolean;
  presentations: DevotionalPresentation[];
}

export interface Devotional {
  id: string;
  slug: string;
  title: string;
  date: string;           // ISO date: 2025-01-15
  tags: string[];
  verses: string[];        // ['joh-3-16', 'rom-8-28']
  type: DevotionalType;
  versions: DevotionalVersion[];
  createdAt: number;
  updatedAt: number;
}

export const devotionalTypeLabels: Record<DevotionalType, string> = {
  andakt: 'Andakt',
  preken: 'Preken',
  bibeltime: 'Bibeltime',
  refleksjon: 'Refleksjon',
  studie: 'Studie',
  bonn: 'Bønn',
  undervisning: 'Undervisning',
};
