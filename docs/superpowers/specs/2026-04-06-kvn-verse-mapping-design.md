# KVN Verse Mapping Integration

## Goal

Integrate the `@free-bible/kvn` library so the Bible app can display osnb2 text with correct verse numbering for any supported translation (DNB2024, KJV, etc.), including sub-verse slicing and chapter boundary shifts.

## Architecture

```
User selects mapping (e.g. "dnb2024_nb")
        ↓
GET /api/chapter?book=1&chapter=32&mapping=dnb2024_nb
        ↓
API: VerseMapper uses CrossMapper(osnb2, dnb2024)
  → Build reverse index: for each target verse in chapter 32,
    find corresponding osnb2 verse(s)
  → Fetch osnb2 text for those verses
  → Apply sliceVersePart() for partial verses
        ↓
Response: verses with displayChapter/displayVerse + original osnb2 coords
```

### Key insight

The database stores verses with **osnb2 numbering**. KVN maps between osnb2 and any target system at runtime. No data migration needed.

When the user views "1 Mos 32" with DNB2024 mapping:
- DNB2024 chapter 32 starts at verse 1
- osnb2 chapter 32 starts at verse 2 (osnb2 32:1 = osmain 31:55)
- The mapper finds that DNB2024 32:1 = osnb2 32:2, DNB2024 32:2 = osnb2 32:3, etc.
- Some DNB2024 chapter 32 verses may come from osnb2 chapter 31 or 33

## Components

### 1. `api/lib/verse-mapper.ts` — Core mapping module

**Responsibilities:**
- Load and cache UkvnMapper/CrossMapper instances at startup
- Provide `listMappings()` — available mapping systems
- Provide `mapChapter(bookId, chapter, mapping)` — returns which osnb2 verses to fetch and how to display them

**Reverse index strategy:**
CrossMapper maps source→target. We need target→source (given DNB2024 chapter X, find all osnb2 verses). Approach:

For a given book+chapter in the target system, iterate all osnb2 verses for that book and map each through CrossMapper. Collect those whose target chapter matches. This is simple and fast enough — max ~176 verses per chapter, CrossMapper.map() is O(1).

Cache the result per (book, chapter, mapping) since it's deterministic.

**Return type per verse:**
```typescript
interface MappedVerse {
  displayChapter: number;   // target system chapter
  displayVerse: number;     // target system verse
  osnb2Chapter: number;     // where to fetch text
  osnb2Verse: number;       // where to fetch text
  partial: boolean;         // needs sliceVersePart()
  part: number;             // which part (0=whole, 1=a, 2=b, ...)
  totalParts: number;       // total parts in this osmain verse
}
```

### 2. Chapter API extension

Add optional `mapping` query parameter to `GET /api/chapter`.

When `mapping` is provided:
1. Call `verseMapper.mapChapter(bookId, chapter, mapping)`
2. Fetch osnb2 verses for all referenced osnb2 coordinates (may span multiple chapters)
3. For partial verses, apply `sliceVersePart()` to the text
4. Return verses with both display numbering and osnb2 source coordinates
5. word4word, references, originalVerses keyed by display verse number

When `mapping` is omitted: current behavior (osnb2 numbering).

### 3. Mappings API endpoint

`GET /api/mappings/kvn` — list available KVN mappings with metadata (name, entry count, description).

### 4. Import flow (future)

When importing a Bible translation, store `mapping` identifier alongside the bible ID. The `bible_translations` table or equivalent records which KVN mapping each imported bible uses. Not in scope for this phase — API-layer first.

## Data flow example

User views DNB2024's "1 Mos 32":

1. API receives `book=1, chapter=32, mapping=dnb2024_nb`
2. VerseMapper iterates osnb2 verses for book 1 (all chapters that might contain relevant verses — practically chapters 31-33)
3. For each osnb2 verse, CrossMapper gives the DNB2024 coordinate
4. Filter to those where target chapter = 32
5. Sort by target verse number
6. Fetch osnb2 text, apply sliceVersePart() where partial=true
7. Return with displayVerse numbers

## Edge cases

- **Chapter boundary verses:** osnb2 31:55 maps to DNB2024 31:55 — it does NOT appear in DNB2024 chapter 32 even though osnb2 32:1 maps to DNB2024 32:1. The reverse-index handles this correctly.
- **Sub-verse parts:** When osmain merges two translation verses into one (common in Psalms), sliceVersePart splits the text. The `part` and `totalParts` fields indicate which slice to use.
- **No mapping needed:** If mapping=osnb2 or omitted, pass through directly — no CrossMapper overhead.
- **Psalms with superscriptions:** osnb2 has them as separate verses; osmain merges into v1. The mapping handles the offset.

## Not in scope

- UI mapping selector (later)
- Import dialog with mapping choice (later)  
- Client-side mapping (stays server-side, KVN uses fs)
- New database tables (not needed for phase 1 — mapping is runtime)
