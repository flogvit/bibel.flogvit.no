/**
 * Engangsskript: Splitt stories.json til individuelle filer per historie.
 *
 * Leser ../free-bible/generate/stories/nb/stories.json
 * Skriver hver historie til ../free-bible/generate/stories/nb/{slug}.json
 * Omdøper original til stories.json.bak
 */

import * as fs from 'fs';
import * as path from 'path';

const STORIES_DIR = path.join(process.cwd(), '..', 'free-bible', 'generate', 'stories', 'nb');
const STORIES_FILE = path.join(STORIES_DIR, 'stories.json');
const BACKUP_FILE = path.join(STORIES_DIR, 'stories.json.bak');

if (!fs.existsSync(STORIES_FILE)) {
  console.error(`Finner ikke ${STORIES_FILE}`);
  process.exit(1);
}

const content = fs.readFileSync(STORIES_FILE, 'utf-8');
const stories: any[] = JSON.parse(content);

console.log(`Leser ${stories.length} historier fra stories.json...`);

let created = 0;
let skipped = 0;

for (const story of stories) {
  const slug = story.slug;
  if (!slug) {
    console.error('Historie mangler slug:', JSON.stringify(story).substring(0, 100));
    continue;
  }

  const outPath = path.join(STORIES_DIR, `${slug}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  Hopper over ${slug}.json (finnes allerede)`);
    skipped++;
    continue;
  }

  fs.writeFileSync(outPath, JSON.stringify(story, null, 2) + '\n', 'utf-8');
  created++;
}

// Rename original to backup
if (fs.existsSync(BACKUP_FILE)) {
  console.log(`\nBackup finnes allerede: stories.json.bak`);
} else {
  fs.renameSync(STORIES_FILE, BACKUP_FILE);
  console.log(`\nOmdøpt stories.json → stories.json.bak`);
}

console.log(`\nFerdig! Opprettet ${created} filer, hoppet over ${skipped}.`);
