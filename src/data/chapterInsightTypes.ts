/**
 * Type definitions for chapter insights
 * Data is stored as JSON in the database and loaded at runtime
 */

// Base type for all insights
export interface ChapterInsightBase {
  type: string;
  title: string;
  buttonText: string;
  hint: string;
  intro: string;
}

// Genealogy insight (ættetavler)
export interface GenealogyPerson {
  name: string;
  years?: string;
  note?: string;
  personId?: string;
}

export interface GenealogySection {
  title: string;
  startVerse: number;
  endVerse: number;
  persons: GenealogyPerson[];
}

export interface GenealogyFooter {
  title: string;
  content: string;
  links?: { personId: string; text: string }[];
}

export interface GenealogyInsight extends ChapterInsightBase {
  type: 'genealogy';
  sections: GenealogySection[];
  footer?: GenealogyFooter;
}

// List insight (10 bud, saligprisninger, etc.)
export interface ListItem {
  number?: number;
  title: string;
  text: string;
  verses: number[];
}

export interface ListInsight extends ChapterInsightBase {
  type: 'list';
  items: ListItem[];
}

// Two-column insight (Åndens frukt vs kjødets gjerninger)
export interface TwoColumnItem {
  text: string;
}

export interface TwoColumnInsight extends ChapterInsightBase {
  type: 'two-column';
  leftTitle: string;
  rightTitle: string;
  leftItems: TwoColumnItem[];
  rightItems: TwoColumnItem[];
  verses: { left: number[]; right: number[] };
  footer?: string;
}

// Person list insight (12 apostler, dommerne)
export interface PersonListPerson {
  name: string;
  description: string;
  note?: string;
  personId?: string;
}

export interface PersonListInsight extends ChapterInsightBase {
  type: 'person-list';
  persons: PersonListPerson[];
}

// Creation days insight
export interface CreationDay {
  day: number;
  title: string;
  created: string[];
  verses: number[];
}

export interface CreationInsight extends ChapterInsightBase {
  type: 'creation';
  days: CreationDay[];
}

// Faith heroes insight (Heb 11)
export interface FaithHero {
  name: string;
  deed: string;
  verses: number[];
  personId?: string;
}

export interface FaithHeroesInsight extends ChapterInsightBase {
  type: 'faith-heroes';
  heroes: FaithHero[];
}

// Union type for all insights
export type ChapterInsight =
  | GenealogyInsight
  | ListInsight
  | TwoColumnInsight
  | PersonListInsight
  | CreationInsight
  | FaithHeroesInsight;
