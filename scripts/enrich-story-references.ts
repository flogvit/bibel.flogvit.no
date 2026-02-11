/**
 * Berik bibelhistorier med evangelieparalleller.
 *
 * Leser gospel_parallel_passages fra databasen,
 * matcher mot eksisterende historie-referanser,
 * og legger til manglende parallellreferanser i historiefilene.
 *
 * Kjøres etter split-stories.ts.
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'bible.db');
const STORIES_DIR = path.join(process.cwd(), '..', 'free-bible', 'generate', 'stories', 'nb');

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database ikke funnet: ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

interface StoryRef {
  bookId: number;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
}

interface Story {
  slug: string;
  title: string;
  keywords: string[];
  description: string;
  category: string;
  references: StoryRef[];
}

interface GospelPassage {
  parallel_id: string;
  parallel_title: string;
  gospel: string;
  book_id: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
}

// Hent alle gospel parallel passages gruppert per parallel_id
const passages = db.prepare(`
  SELECT gpp.parallel_id, gp.title as parallel_title, gpp.gospel, gpp.book_id, gpp.chapter, gpp.verse_start, gpp.verse_end
  FROM gospel_parallel_passages gpp
  JOIN gospel_parallels gp ON gp.id = gpp.parallel_id
  ORDER BY gpp.parallel_id
`).all() as GospelPassage[];

// Grupper per parallel_id
const parallelGroups = new Map<string, GospelPassage[]>();
for (const p of passages) {
  const group = parallelGroups.get(p.parallel_id) || [];
  group.push(p);
  parallelGroups.set(p.parallel_id, group);
}

console.log(`Lastet ${parallelGroups.size} evangelieparalleller fra databasen.`);

// Sjekk om to referanser overlapper (bok + kapittel/vers-range)
function rangesOverlap(storyRef: StoryRef, passage: GospelPassage): boolean {
  if (storyRef.bookId !== passage.book_id) return false;

  // Konverter til lineære posisjoner for enkel sammenligning
  // Bruk kapittel*1000 + vers som tilnærming
  const storyStart = storyRef.startChapter * 1000 + storyRef.startVerse;
  const storyEnd = storyRef.endChapter * 1000 + storyRef.endVerse;
  const passageStart = passage.chapter * 1000 + passage.verse_start;
  const passageEnd = passage.chapter * 1000 + passage.verse_end;

  // Overlap: start1 <= end2 && start2 <= end1
  return storyStart <= passageEnd && passageStart <= storyEnd;
}

// Sjekk om en referanse allerede finnes i listen
function hasReference(refs: StoryRef[], bookId: number, startChapter: number, startVerse: number, endChapter: number, endVerse: number): boolean {
  return refs.some(r =>
    r.bookId === bookId &&
    r.startChapter === startChapter &&
    r.startVerse === startVerse &&
    r.endChapter === endChapter &&
    r.endVerse === endVerse
  );
}

// Les alle historiefiler
const storyFiles = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.json') && f !== 'stories.json');
console.log(`Fant ${storyFiles.length} historiefiler.`);

let enrichedCount = 0;
let totalNewRefs = 0;

for (const file of storyFiles) {
  const filePath = path.join(STORIES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const story: Story = JSON.parse(content);

  if (!story.references || story.references.length === 0) continue;

  let modified = false;
  const newRefs: StoryRef[] = [];

  // For hver eksisterende referanse i historien
  for (const storyRef of story.references) {
    // Sjekk om den matcher noen evangelieparallell
    for (const [parallelId, group] of parallelGroups) {
      const matchingPassage = group.find(p => rangesOverlap(storyRef, p));
      if (!matchingPassage) continue;

      // Fant en match - legg til alle andre passasjer i denne parallellgruppen
      for (const otherPassage of group) {
        if (otherPassage === matchingPassage) continue;

        const newRef: StoryRef = {
          bookId: otherPassage.book_id,
          startChapter: otherPassage.chapter,
          startVerse: otherPassage.verse_start,
          endChapter: otherPassage.chapter,
          endVerse: otherPassage.verse_end,
        };

        // Sjekk at vi ikke allerede har denne referansen
        if (!hasReference(story.references, newRef.bookId, newRef.startChapter, newRef.startVerse, newRef.endChapter, newRef.endVerse) &&
            !hasReference(newRefs, newRef.bookId, newRef.startChapter, newRef.startVerse, newRef.endChapter, newRef.endVerse)) {
          newRefs.push(newRef);
        }
      }
    }
  }

  if (newRefs.length > 0) {
    story.references.push(...newRefs);
    fs.writeFileSync(filePath, JSON.stringify(story, null, 2) + '\n', 'utf-8');
    console.log(`  ${story.slug}: +${newRefs.length} referanser (totalt ${story.references.length})`);
    enrichedCount++;
    totalNewRefs += newRefs.length;
    modified = true;
  }
}

db.close();

console.log(`\nFerdig! Beriket ${enrichedCount} historier med ${totalNewRefs} nye referanser.`);
