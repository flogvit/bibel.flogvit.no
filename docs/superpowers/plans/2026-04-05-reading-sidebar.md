# Reading Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed timeline-only right sidebar with a tabbed, resizable sidebar offering timeline, context, resources, and verse lookup — plus three layout modes (normal, reading, panel).

**Architecture:** New `ReadingSidebar` component wraps existing `TimelinePanel` and new tab panels. Layout modes controlled via `layoutMode` setting with CSS grid variants. Drag-resize via mouse events on a handle element. Settings migrated from `readingMode` boolean to `layoutMode` enum.

**Tech Stack:** React, SCSS Modules, localStorage/IndexedDB settings

---

## File Structure

### New Files
- `src/components/bible/ReadingSidebar.tsx` — Tabbed sidebar container with drag resize handle
- `src/components/bible/ReadingSidebar.module.scss` — Sidebar styles including tabs, resize handle
- `src/components/bible/sidebar/ContextPanel.tsx` — Context tab (summaries, important words)
- `src/components/bible/sidebar/ContextPanel.module.scss` — Context panel styles
- `src/components/bible/sidebar/ResourcesPanel.tsx` — Resources tab (search-based)
- `src/components/bible/sidebar/ResourcesPanel.module.scss` — Resources panel styles
- `src/components/bible/sidebar/LookupPanel.tsx` — Verse lookup tab
- `src/components/bible/sidebar/LookupPanel.module.scss` — Lookup panel styles
- `src/components/bible/LayoutModeButtons.tsx` — Header layout toggle group
- `src/components/bible/LayoutModeButtons.module.scss` — Layout button styles
- `src/components/bible/MobileSidebarOverlay.tsx` — Full tabbed mobile overlay (replaces TimelineMobileOverlay usage)
- `src/components/bible/MobileSidebarOverlay.module.scss` — Mobile overlay styles

### Modified Files
- `src/lib/offline/userData.ts` — Add `layoutMode`, `sidebarTab`, `sidebarWidth`, `showContextInline` to BibleSettings
- `src/lib/settings.ts` — Re-export new types
- `src/components/SettingsContext.tsx` — Handle `layoutMode` migration from `readingMode`
- `src/components/bible/ReadingModeWrapper.tsx` — Use `layoutMode` instead of `readingMode`
- `src/components/bible/ChapterContent.tsx` — Use `ReadingSidebar`, pass layout mode class, conditionally render context sections
- `src/styles/pages/chapter.module.scss` — Add `.panelMode` grid, update `.reading-mode` references
- `src/components/Header.tsx` — Replace reading mode button with `LayoutModeButtons`
- `src/components/bible/ChapterKeyboardShortcuts.tsx` — Add N, R, P, 1-4 shortcuts
- `src/components/bible/MobileToolbar.tsx` — Replace timeline button with sidebar button, use `MobileSidebarOverlay`
- `src/components/bible/ToolsPanel.tsx` — Add `showContextInline` toggle, remove `showTimeline` toggle

---

### Task 1: Add new settings to BibleSettings

**Files:**
- Modify: `src/lib/offline/userData.ts:287-339`
- Modify: `src/lib/settings.ts:12-21`

- [ ] **Step 1: Add new types and settings fields**

In `src/lib/offline/userData.ts`, add the `LayoutMode` and `SidebarTab` types before the `BibleSettings` interface, and add new fields to `BibleSettings`:

```typescript
export type LayoutMode = 'normal' | 'reading' | 'panel';
export type SidebarTab = 'timeline' | 'context' | 'resources' | 'lookup';
```

Add to `BibleSettings` interface (after `readingMode`):
```typescript
  layoutMode: LayoutMode;
  sidebarTab: SidebarTab;
  sidebarWidth: number;
  showContextInline: boolean;
```

Add to `defaultSettings`:
```typescript
  layoutMode: 'normal',
  sidebarTab: 'timeline',
  sidebarWidth: 280,
  showContextInline: false,
```

- [ ] **Step 2: Re-export new types from settings.ts**

In `src/lib/settings.ts`, add to the re-export list:
```typescript
export type { LayoutMode, SidebarTab } from './offline/userData';
```

- [ ] **Step 3: Handle migration in SettingsContext**

In `src/components/SettingsContext.tsx`, after settings are loaded (inside the `useEffect` that calls `getSettings()`), add migration logic:

```typescript
// Migrate readingMode → layoutMode
if (loaded.readingMode && loaded.layoutMode === 'normal') {
  loaded.layoutMode = 'reading';
  loaded.readingMode = false;
}
```

- [ ] **Step 4: Verify the app still loads**

Run: `npm run dev:all`
Open http://localhost:3020 and verify no console errors. Check that existing settings load correctly.

- [ ] **Step 5: Commit**

```bash
git add src/lib/offline/userData.ts src/lib/settings.ts src/components/SettingsContext.tsx
git commit -m "Add layoutMode, sidebarTab, sidebarWidth settings with migration"
```

---

### Task 2: Update ReadingModeWrapper to use layoutMode

**Files:**
- Modify: `src/components/bible/ReadingModeWrapper.tsx`
- Modify: `src/styles/pages/chapter.module.scss`

- [ ] **Step 1: Update ReadingModeWrapper**

Replace the component to use `layoutMode`:

```typescript
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
```

- [ ] **Step 2: Add panel-mode grid to chapter.module.scss**

Add a new `panel-mode` block alongside the existing `reading-mode` block in `.main`:

```scss
&:global(.panel-mode) {
  .layout {
    grid-template-columns: 1fr 1fr;
  }

  .sidebar {
    display: none;
  }

  .content {
    max-width: none;
    padding-right: $spacing-lg;
  }
}
```

- [ ] **Step 3: Verify panel mode works**

Temporarily set `defaultSettings.layoutMode` to `'panel'` and verify the layout renders as 50/50 split. Then revert to `'normal'`.

- [ ] **Step 4: Commit**

```bash
git add src/components/bible/ReadingModeWrapper.tsx src/styles/pages/chapter.module.scss
git commit -m "Support layoutMode in ReadingModeWrapper with panel-mode grid"
```

---

### Task 3: Layout mode buttons in Header

**Files:**
- Create: `src/components/bible/LayoutModeButtons.tsx`
- Create: `src/components/bible/LayoutModeButtons.module.scss`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Create LayoutModeButtons component**

```typescript
import { useSettings } from '@/components/SettingsContext';
import type { LayoutMode } from '@/lib/settings';
import styles from './LayoutModeButtons.module.scss';

const modes: { value: LayoutMode; label: string; title: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', title: 'Normal visning (N)', icon: '☰' },
  { value: 'reading', label: 'Lesemodus', title: 'Lesemodus (R)', icon: '📖' },
  { value: 'panel', label: 'Panelmodus', title: 'Panelmodus (P)', icon: '▥' },
];

export function LayoutModeButtons() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className={styles.group} role="radiogroup" aria-label="Visningsmodus">
      {modes.map(mode => (
        <button
          key={mode.value}
          className={`${styles.button} ${settings.layoutMode === mode.value ? styles.active : ''}`}
          onClick={() => updateSetting('layoutMode', mode.value)}
          aria-label={mode.label}
          aria-pressed={settings.layoutMode === mode.value}
          title={mode.title}
        >
          <span aria-hidden="true">{mode.icon}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create LayoutModeButtons.module.scss**

```scss
@use '@/styles/variables' as *;

.group {
  display: flex;
  gap: 2px;
  background: $color-background;
  border-radius: $radius-sm;
  padding: 2px;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-muted;
  transition: all $transition-fast;

  &:hover {
    background: $color-paper;
    color: $color-text;
  }

  &.active {
    background: $color-paper;
    color: $color-primary;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

:global(html.dark) {
  .group {
    background: $dark-color-background;
  }

  .button {
    color: $dark-color-text-muted;

    &:hover {
      background: $dark-color-paper;
      color: $dark-color-text;
    }

    &.active {
      background: $dark-color-paper;
      color: $dark-color-primary;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
  }
}
```

- [ ] **Step 3: Replace reading mode button in Header**

In `src/components/Header.tsx`, replace the reading mode button (lines 140-148) with:

```typescript
import { LayoutModeButtons } from '@/components/bible/LayoutModeButtons';
```

Replace the `<button className={...readingModeButton...}>` block with:
```typescript
<LayoutModeButtons />
```

- [ ] **Step 4: Verify all three modes work**

Open http://localhost:3020, navigate to a chapter. Click each layout mode button and verify:
- Normal: three-column layout
- Reading: text only
- Panel: 50/50 split

- [ ] **Step 5: Commit**

```bash
git add src/components/bible/LayoutModeButtons.tsx src/components/bible/LayoutModeButtons.module.scss src/components/Header.tsx
git commit -m "Add layout mode toggle buttons in header (normal/reading/panel)"
```

---

### Task 4: ReadingSidebar shell with tabs

**Files:**
- Create: `src/components/bible/ReadingSidebar.tsx`
- Create: `src/components/bible/ReadingSidebar.module.scss`
- Modify: `src/components/bible/ChapterContent.tsx`

- [ ] **Step 1: Create ReadingSidebar component**

```typescript
import { useSettings } from '@/components/SettingsContext';
import { TimelinePanel } from './TimelinePanel';
import type { SidebarTab } from '@/lib/settings';
import type { TimelineEvent } from '@/lib/bible';
import styles from './ReadingSidebar.module.scss';

const tabs: { value: SidebarTab; label: string }[] = [
  { value: 'timeline', label: 'Tidslinje' },
  { value: 'context', label: 'Kontekst' },
  { value: 'resources', label: 'Ressurser' },
  { value: 'lookup', label: 'Oppslag' },
];

interface ReadingSidebarProps {
  bookId: number;
  chapter: number;
  bookName: string;
  timelineEvents: TimelineEvent[];
  chapterEventIds: string[];
  // Data for context tab (passed from ChapterContent)
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
}

export function ReadingSidebar({
  bookId,
  chapter,
  bookName,
  timelineEvents,
  chapterEventIds,
  bookSummary,
  chapterSummary,
  historicalContext,
}: ReadingSidebarProps) {
  const { settings, updateSetting } = useSettings();
  const activeTab = settings.sidebarTab || 'timeline';

  const setActiveTab = (tab: SidebarTab) => {
    updateSetting('sidebarTab', tab);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'timeline' && (
          <TimelinePanel
            events={timelineEvents}
            chapterEventIds={chapterEventIds}
            currentBookId={bookId}
            currentChapter={chapter}
          />
        )}

        {activeTab === 'context' && (
          <div className={styles.placeholder}>Kontekst (kommer i neste steg)</div>
        )}

        {activeTab === 'resources' && (
          <div className={styles.placeholder}>Ressurser (kommer i neste steg)</div>
        )}

        {activeTab === 'lookup' && (
          <div className={styles.placeholder}>Oppslag (kommer i neste steg)</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ReadingSidebar.module.scss**

```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.sidebar {
  display: flex;
  flex-direction: column;
  background: $color-paper;
  border-left: 1px solid $color-border;
  position: sticky;
  top: 3.75rem;
  height: calc(100vh - 3.75rem);
  overflow: hidden;

  @include tablet {
    display: none;
  }
}

.tabs {
  display: flex;
  border-bottom: 1px solid $color-border;
  padding: $spacing-xs $spacing-xs 0;
  gap: 2px;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  padding: $spacing-sm $spacing-xs;
  border: none;
  background: transparent;
  font-size: $font-size-xs;
  color: $color-text-muted;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all $transition-fast;
  white-space: nowrap;

  &:hover {
    color: $color-text;
    background: $color-background;
  }

  &.active {
    color: $color-primary;
    border-bottom-color: $color-secondary;
  }
}

.content {
  flex: 1;
  overflow-y: auto;
}

.placeholder {
  padding: $spacing-lg;
  color: $color-text-muted;
  text-align: center;
  font-size: $font-size-sm;
}

// Dark mode
:global(html.dark) {
  .sidebar {
    background: $dark-color-paper;
    border-left-color: $dark-color-border;
  }

  .tabs {
    border-bottom-color: $dark-color-border;
  }

  .tab {
    color: $dark-color-text-muted;

    &:hover {
      color: $dark-color-text;
      background: $dark-color-background;
    }

    &.active {
      color: $dark-color-primary;
      border-bottom-color: $dark-color-secondary;
    }
  }

  .placeholder {
    color: $dark-color-text-muted;
  }
}
```

- [ ] **Step 3: Wire ReadingSidebar into ChapterContent**

In `src/components/bible/ChapterContent.tsx`:

Replace the import of `TimelinePanel`:
```typescript
import { ReadingSidebar } from '@/components/bible/ReadingSidebar';
```

Replace the right sidebar `<aside>` block (lines 369-376) with:
```typescript
<aside className={styles.rightSidebar}>
  <ReadingSidebar
    bookId={bookId}
    chapter={chapter}
    bookName={bookName}
    timelineEvents={timelineEvents}
    chapterEventIds={chapterEventIds}
    bookSummary={bookSummary}
    chapterSummary={summary}
    historicalContext={context}
  />
</aside>
```

- [ ] **Step 4: Remove rightSidebar styling duplication**

Since `ReadingSidebar` now handles its own sticky/height/background, update `.rightSidebar` in `chapter.module.scss` to be minimal:

```scss
.rightSidebar {
  @include tablet {
    display: none;
  }
}
```

Also update `TimelinePanel.module.scss` — the `.panel` class should no longer set `position: sticky`, `top`, `height`, `background`, or `border-left` since those are now in `ReadingSidebar`. Change `.panel` to:

```scss
.panel {
  padding: $spacing-lg;

  @include tablet {
    display: none;
  }
}
```

And in the dark mode section, remove the `.panel` background/border overrides (they're now handled by `ReadingSidebar`).

- [ ] **Step 5: Verify tabs appear and timeline still works**

Open a chapter page. Verify:
- Four tabs visible at top of right sidebar
- Timeline tab shows the timeline as before
- Other tabs show placeholder text
- Switching tabs works and persists on page reload

- [ ] **Step 6: Commit**

```bash
git add src/components/bible/ReadingSidebar.tsx src/components/bible/ReadingSidebar.module.scss src/components/bible/ChapterContent.tsx src/styles/pages/chapter.module.scss src/components/bible/TimelinePanel.module.scss
git commit -m "Add ReadingSidebar with tabs, wire into ChapterContent"
```

---

### Task 5: Context tab — move content from main area

**Files:**
- Create: `src/components/bible/sidebar/ContextPanel.tsx`
- Create: `src/components/bible/sidebar/ContextPanel.module.scss`
- Modify: `src/components/bible/ReadingSidebar.tsx`
- Modify: `src/components/bible/ChapterContent.tsx`
- Modify: `src/components/bible/ToolsPanel.tsx`

- [ ] **Step 1: Create ContextPanel**

```typescript
import { useState } from 'react';
import { InlineRefs } from '@/components/InlineRefs';
import { ImportantWords } from '@/components/bible/ImportantWords';
import styles from './ContextPanel.module.scss';

interface ContextPanelProps {
  bookId: number;
  chapter: number;
  bookName: string;
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
}

interface SectionState {
  book: boolean;
  chapter: boolean;
  context: boolean;
  words: boolean;
}

export function ContextPanel({
  bookId,
  chapter,
  bookName,
  bookSummary,
  chapterSummary,
  historicalContext,
}: ContextPanelProps) {
  const [open, setOpen] = useState<SectionState>({
    book: true,
    chapter: true,
    context: true,
    words: true,
  });

  const toggle = (key: keyof SectionState) => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasContent = bookSummary || chapterSummary || historicalContext;

  if (!hasContent) {
    return (
      <div className={styles.empty}>
        Ingen kontekstinformasjon tilgjengelig for dette kapittelet.
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {bookSummary && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('book')}>
            <span>Om {bookName}</span>
            <span className={styles.chevron}>{open.book ? '▾' : '▸'}</span>
          </button>
          {open.book && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{bookSummary}</InlineRefs>
            </div>
          )}
        </section>
      )}

      {chapterSummary && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('chapter')}>
            <span>Kapittel {chapter}</span>
            <span className={styles.chevron}>{open.chapter ? '▾' : '▸'}</span>
          </button>
          {open.chapter && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{chapterSummary}</InlineRefs>
            </div>
          )}
        </section>
      )}

      {historicalContext && (
        <section className={styles.section}>
          <button className={styles.sectionHeader} onClick={() => toggle('context')}>
            <span>Historisk kontekst</span>
            <span className={styles.chevron}>{open.context ? '▾' : '▸'}</span>
          </button>
          {open.context && (
            <div className={styles.sectionContent}>
              <InlineRefs markdown>{historicalContext}</InlineRefs>
            </div>
          )}
        </section>
      )}

      <section className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => toggle('words')}>
          <span>Viktige ord</span>
          <span className={styles.chevron}>{open.words ? '▾' : '▸'}</span>
        </button>
        {open.words && (
          <div className={styles.sectionContent}>
            <ImportantWords bookId={bookId} chapter={chapter} embedded />
          </div>
        )}
      </section>
    </div>
  );
}
```

Note: `ImportantWords` needs a new `embedded` prop that skips the settings check and outer wrapper, since when it's in the sidebar it should always show. Add this prop to ImportantWords:

In `src/components/bible/ImportantWords.tsx`, add `embedded?: boolean` to the props interface, and update the visibility check:

```typescript
interface ImportantWordsProps {
  bookId: number;
  chapter: number;
  embedded?: boolean;
}
```

Change the condition for hiding (the early return that checks `settings.showImportantWords` and `readingMode`) to:

```typescript
if (!embedded && (settings.readingMode || !settings.showImportantWords)) {
  return null;
}
```

- [ ] **Step 2: Create ContextPanel.module.scss**

```scss
@use '@/styles/variables' as *;

.panel {
  padding: $spacing-sm;
}

.section {
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: none;
  background: transparent;
  font-family: $font-serif;
  font-size: $font-size-sm;
  font-weight: 400;
  color: $color-primary;
  cursor: pointer;
  text-align: left;
  transition: background $transition-fast;

  &:hover {
    background: $color-background;
  }
}

.chevron {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.sectionContent {
  padding: 0 $spacing-md $spacing-md;
  font-size: $font-size-sm;
  line-height: $line-height-base;
  color: $color-text-light;

  p {
    margin: 0 0 $spacing-sm 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.empty {
  padding: $spacing-lg;
  color: $color-text-muted;
  text-align: center;
  font-size: $font-size-sm;
}

:global(html.dark) {
  .section {
    border-bottom-color: $dark-color-border;
  }

  .sectionHeader {
    color: $dark-color-primary;

    &:hover {
      background: $dark-color-background;
    }
  }

  .chevron {
    color: $dark-color-text-muted;
  }

  .sectionContent {
    color: $dark-color-text-light;
  }

  .empty {
    color: $dark-color-text-muted;
  }
}
```

- [ ] **Step 3: Wire ContextPanel into ReadingSidebar**

In `ReadingSidebar.tsx`, replace the context placeholder:

```typescript
import { ContextPanel } from './sidebar/ContextPanel';

// In the render, replace the context placeholder with:
{activeTab === 'context' && (
  <ContextPanel
    bookId={bookId}
    chapter={chapter}
    bookName={bookName}
    bookSummary={bookSummary}
    chapterSummary={chapterSummary}
    historicalContext={historicalContext}
  />
)}
```

- [ ] **Step 4: Conditionally render context in main area**

In `ChapterContent.tsx`, wrap the book summary, chapter summary, historical context, and ImportantWords sections with a `showContextInline` check:

```typescript
{settings.showContextInline && (
  <>
    {bookSummary && (
      <Summary type="book" title={`Om ${bookName}`} content={bookSummary} />
    )}
    {summary && (
      <Summary type="chapter" title={`Kapittel ${chapter}`} content={summary} />
    )}
    {context && (
      <Summary type="context" title="Historisk kontekst" content={context} />
    )}
    <ImportantWords bookId={bookId} chapter={chapter} />
  </>
)}
```

- [ ] **Step 5: Add showContextInline toggle to ToolsPanel**

In `src/components/bible/ToolsPanel.tsx`, add a new toggle to the tools array:

```typescript
{ key: 'showContextInline', label: 'Vis kontekst i toppen' },
```

Remove these entries from the tools array since they're now always in the sidebar:
- `showBookSummary`
- `showChapterSummary`
- `showChapterContext`
- `showImportantWords`

Also remove `showTimeline` since it's now a sidebar tab.

- [ ] **Step 6: Verify context tab**

Open a chapter page, click "Kontekst" tab. Verify:
- Book summary, chapter summary, historical context, important words all show
- Sections are collapsible
- Context is NOT shown in main area by default
- Toggling "Vis kontekst i toppen" in ToolsPanel shows them in main area too

- [ ] **Step 7: Commit**

```bash
git add src/components/bible/sidebar/ContextPanel.tsx src/components/bible/sidebar/ContextPanel.module.scss src/components/bible/ReadingSidebar.tsx src/components/bible/ChapterContent.tsx src/components/bible/ToolsPanel.tsx src/components/bible/ImportantWords.tsx
git commit -m "Add context tab to sidebar, move summaries from main area"
```

---

### Task 6: Lookup tab — verse lookup

**Files:**
- Create: `src/components/bible/sidebar/LookupPanel.tsx`
- Create: `src/components/bible/sidebar/LookupPanel.module.scss`
- Modify: `src/components/bible/ReadingSidebar.tsx`

- [ ] **Step 1: Create LookupPanel**

Adapt from `src/components/devotional/BibleLookupPanel.tsx` but without insert functionality. Key differences:
- No `onInsert` prop
- No insert/quote buttons
- Results display inline with expandable word-for-word

```typescript
import { useState, useRef } from 'react';
import { parseStandardRef } from '@/lib/standard-ref-parser';
import { useSettings } from '@/components/SettingsContext';
import { InlineRefs } from '@/components/InlineRefs';
import styles from './LookupPanel.module.scss';

interface VerseResult {
  verse: number;
  text: string;
  book_name?: string;
  chapter?: number;
}

interface Word4WordItem {
  original: string;
  transliteration: string;
  translation: string;
  explanation?: string;
}

export function LookupPanel() {
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VerseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);
  const [word4word, setWord4word] = useState<Record<string, Word4WordItem[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Try parsing as reference first
      const refs = parseStandardRef(query.trim());
      if (refs.length > 0) {
        const refStrings = refs.map(r => {
          const verseRange = r.verseStart
            ? r.verseEnd && r.verseEnd !== r.verseStart
              ? `-${r.verseStart}-${r.verseEnd}`
              : `-${r.verseStart}`
            : '';
          return `${r.bookSlug}-${r.chapter}${verseRange}`;
        });

        const res = await fetch('/api/verses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs: refStrings, bible: settings.bible }),
        });
        const data = await res.json();
        setResults(data.verses || []);
      } else {
        // Fall back to text search
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&bible=${settings.bible}&limit=20`);
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      setError('Kunne ikke søke. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandVerse = async (verseKey: string, bookId: number, chapter: number, verse: number) => {
    if (expandedVerse === verseKey) {
      setExpandedVerse(null);
      return;
    }
    setExpandedVerse(verseKey);

    if (!word4word[verseKey]) {
      try {
        const res = await fetch(`/api/word4word?bookId=${bookId}&chapter=${chapter}&verse=${verse}`);
        const data = await res.json();
        if (data.words) {
          setWord4word(prev => ({ ...prev, [verseKey]: data.words }));
        }
      } catch {
        // Word4word not available for all verses
      }
    }
  };

  return (
    <div className={styles.panel}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Joh 3,16 eller søketekst..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? '...' : 'Søk'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.results}>
        {results.map((verse, i) => {
          const verseKey = `${verse.book_name}-${verse.chapter}-${verse.verse}`;
          const isExpanded = expandedVerse === verseKey;

          return (
            <div key={i} className={`${styles.verse} ${isExpanded ? styles.expanded : ''}`}>
              <div className={styles.verseHeader}>
                <span className={styles.verseRef}>
                  {verse.book_name} {verse.chapter}:{verse.verse}
                </span>
              </div>
              <div className={styles.verseText}>
                <InlineRefs>{verse.text}</InlineRefs>
              </div>
              {isExpanded && word4word[verseKey] && (
                <div className={styles.word4word}>
                  {word4word[verseKey].map((w, j) => (
                    <div key={j} className={styles.wordItem}>
                      <span className={styles.original}>{w.original}</span>
                      <span className={styles.transliteration}>{w.transliteration}</span>
                      <span className={styles.translation}>{w.translation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Note: The exact API response shapes should be verified against `BibleLookupPanel.tsx` during implementation and adapted as needed. The core pattern is the same: parse ref → fetch verses, or fallback to text search.

- [ ] **Step 2: Create LookupPanel.module.scss**

```scss
@use '@/styles/variables' as *;

.panel {
  padding: $spacing-sm;
}

.searchForm {
  display: flex;
  gap: $spacing-xs;
  padding: $spacing-sm;
}

.searchInput {
  flex: 1;
  padding: $spacing-sm;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  background: $color-paper;
  color: $color-text;

  &::placeholder {
    color: $color-text-muted;
  }
}

.searchButton {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-background;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-primary;
    color: white;
    border-color: $color-primary;
  }
}

.error {
  padding: $spacing-sm $spacing-md;
  color: #c0392b;
  font-size: $font-size-sm;
}

.results {
  padding: 0 $spacing-sm;
}

.verse {
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $color-border;
  cursor: pointer;

  &:hover {
    background: $color-background;
  }

  &:last-child {
    border-bottom: none;
  }
}

.verseRef {
  font-size: $font-size-xs;
  color: $color-secondary;
  font-weight: 500;
}

.verseText {
  font-size: $font-size-sm;
  line-height: $line-height-base;
  color: $color-text;
  margin-top: 2px;
}

.word4word {
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-border;
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.wordItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xs;
  background: $color-background;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
}

.original {
  font-size: $font-size-sm;
  color: $color-primary;
}

.transliteration {
  font-style: italic;
  color: $color-text-muted;
}

.translation {
  color: $color-text;
  font-weight: 500;
}

:global(html.dark) {
  .searchInput {
    background: $dark-color-background;
    border-color: $dark-color-border;
    color: $dark-color-text;

    &::placeholder {
      color: $dark-color-text-muted;
    }
  }

  .searchButton {
    background: $dark-color-background;
    border-color: $dark-color-border;
    color: $dark-color-text;

    &:hover {
      background: $dark-color-secondary;
      border-color: $dark-color-secondary;
      color: $dark-color-background;
    }
  }

  .verse {
    border-bottom-color: $dark-color-border;

    &:hover {
      background: $dark-color-background;
    }
  }

  .verseRef {
    color: $dark-color-secondary;
  }

  .verseText {
    color: $dark-color-text;
  }

  .word4word {
    border-top-color: $dark-color-border;
  }

  .wordItem {
    background: $dark-color-background;
  }

  .original {
    color: $dark-color-primary;
  }

  .transliteration {
    color: $dark-color-text-muted;
  }

  .translation {
    color: $dark-color-text;
  }
}
```

- [ ] **Step 3: Wire into ReadingSidebar**

```typescript
import { LookupPanel } from './sidebar/LookupPanel';

// Replace lookup placeholder:
{activeTab === 'lookup' && <LookupPanel />}
```

- [ ] **Step 4: Verify lookup works**

Open a chapter, click "Oppslag" tab. Search for "Joh 3,16" and verify verse appears. Search for a word like "kjærlighet" and verify text results appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/bible/sidebar/LookupPanel.tsx src/components/bible/sidebar/LookupPanel.module.scss src/components/bible/ReadingSidebar.tsx
git commit -m "Add verse lookup tab to reading sidebar"
```

---

### Task 7: Resources tab

**Files:**
- Create: `src/components/bible/sidebar/ResourcesPanel.tsx`
- Create: `src/components/bible/sidebar/ResourcesPanel.module.scss`
- Modify: `src/components/bible/ReadingSidebar.tsx`

- [ ] **Step 1: Create ResourcesPanel**

Adapted from `src/components/devotional/ResourceSearchPanel.tsx`. Key differences:
- Auto-searches with book name on mount
- No insert functionality — click opens details, links navigate
- Simpler display focused on reading

```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { InlineRefs } from '@/components/InlineRefs';
import styles from './ResourcesPanel.module.scss';

interface ResourcesPanelProps {
  bookId: number;
  chapter: number;
  bookName: string;
}

interface ResourceItem {
  type: string;
  id: string | number;
  title: string;
  subtitle?: string;
  url?: string;
}

interface ResourceDetail {
  description?: string;
  sections?: { title: string; content: string }[];
}

export function ResourcesPanel({ bookId, chapter, bookName }: ResourcesPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ResourceDetail>>({});
  const [autoSearched, setAutoSearched] = useState<string | null>(null);

  // Auto-search with book name when chapter changes
  useEffect(() => {
    const searchKey = `${bookName} ${chapter}`;
    if (autoSearched === searchKey) return;
    setAutoSearched(searchKey);
    performSearch(bookName);
  }, [bookName, chapter]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/all?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      const items: ResourceItem[] = [];
      if (data.persons) data.persons.forEach((p: any) => items.push({
        type: 'person', id: p.id, title: p.name, subtitle: p.title || p.era, url: `/personer/${p.id}`,
      }));
      if (data.prophecies) data.prophecies.forEach((p: any) => items.push({
        type: 'prophecy', id: p.id, title: p.title, subtitle: p.category_name,
      }));
      if (data.themes) data.themes.forEach((t: any) => items.push({
        type: 'theme', id: t.id, title: t.name, url: `/temaer/${t.id}`,
      }));
      if (data.parallels) data.parallels.forEach((p: any) => items.push({
        type: 'parallel', id: p.id, title: p.title, url: `/paralleller/${p.id}`,
      }));
      if (data.stories) data.stories.forEach((s: any) => items.push({
        type: 'story', id: s.id, title: s.title, subtitle: s.category, url: `/fortellinger/${s.slug}`,
      }));
      if (data.timeline) data.timeline.forEach((t: any) => items.push({
        type: 'timeline', id: t.id, title: t.title, subtitle: t.year_display,
      }));

      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleExpand = async (item: ResourceItem) => {
    const key = `${item.type}-${item.id}`;
    if (expandedId === key) {
      setExpandedId(null);
      return;
    }
    setExpandedId(key);

    if (!details[key]) {
      try {
        let detailData: ResourceDetail = {};
        if (item.type === 'person') {
          const res = await fetch(`/api/persons/${item.id}`);
          const data = await res.json();
          detailData = { description: data.summary };
        } else if (item.type === 'theme') {
          const res = await fetch(`/api/themes/${item.id}`);
          const data = await res.json();
          detailData = { description: data.content ? JSON.parse(data.content)?.introduction : undefined };
        }
        setDetails(prev => ({ ...prev, [key]: detailData }));
      } catch {
        setDetails(prev => ({ ...prev, [key]: {} }));
      }
    }
  };

  const typeLabels: Record<string, string> = {
    person: 'Person',
    prophecy: 'Profeti',
    theme: 'Tema',
    parallel: 'Parallell',
    story: 'Fortelling',
    timeline: 'Tidslinje',
  };

  return (
    <div className={styles.panel}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Søk i ressurser..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? '...' : 'Søk'}
        </button>
      </form>

      {loading && results.length === 0 && (
        <div className={styles.loading}>Søker...</div>
      )}

      <div className={styles.results}>
        {results.map(item => {
          const key = `${item.type}-${item.id}`;
          const isExpanded = expandedId === key;
          const detail = details[key];

          return (
            <div key={key} className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}>
              <div className={styles.itemHeader} onClick={() => handleExpand(item)}>
                <span className={styles.itemType}>{typeLabels[item.type] || item.type}</span>
                <span className={styles.itemTitle}>{item.title}</span>
                {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
              </div>
              {isExpanded && (
                <div className={styles.itemDetail}>
                  {detail?.description && (
                    <p className={styles.description}>
                      <InlineRefs>{detail.description}</InlineRefs>
                    </p>
                  )}
                  {item.url && (
                    <Link to={item.url} className={styles.detailLink}>
                      Les mer →
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ResourcesPanel.module.scss**

```scss
@use '@/styles/variables' as *;

.panel {
  padding: $spacing-sm;
}

.searchForm {
  display: flex;
  gap: $spacing-xs;
  padding: $spacing-sm;
}

.searchInput {
  flex: 1;
  padding: $spacing-sm;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  background: $color-paper;
  color: $color-text;

  &::placeholder {
    color: $color-text-muted;
  }
}

.searchButton {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-background;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-primary;
    color: white;
    border-color: $color-primary;
  }
}

.loading {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.results {
  padding: 0 $spacing-sm;
}

.item {
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.itemHeader {
  display: flex;
  flex-direction: column;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $color-background;
  }
}

.itemType {
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.itemTitle {
  font-family: $font-serif;
  font-size: $font-size-sm;
  color: $color-primary;
}

.itemSubtitle {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.itemDetail {
  padding: 0 $spacing-md $spacing-md;
}

.description {
  font-size: $font-size-sm;
  color: $color-text-light;
  line-height: $line-height-base;
  margin: 0 0 $spacing-sm 0;
}

.detailLink {
  font-size: $font-size-sm;
  color: $color-secondary;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

:global(html.dark) {
  .searchInput {
    background: $dark-color-background;
    border-color: $dark-color-border;
    color: $dark-color-text;

    &::placeholder {
      color: $dark-color-text-muted;
    }
  }

  .searchButton {
    background: $dark-color-background;
    border-color: $dark-color-border;
    color: $dark-color-text;

    &:hover {
      background: $dark-color-secondary;
      border-color: $dark-color-secondary;
      color: $dark-color-background;
    }
  }

  .loading {
    color: $dark-color-text-muted;
  }

  .item {
    border-bottom-color: $dark-color-border;
  }

  .itemHeader:hover {
    background: $dark-color-background;
  }

  .itemType {
    color: $dark-color-text-muted;
  }

  .itemTitle {
    color: $dark-color-primary;
  }

  .itemSubtitle {
    color: $dark-color-text-muted;
  }

  .description {
    color: $dark-color-text-light;
  }

  .detailLink {
    color: $dark-color-secondary;
  }
}
```

- [ ] **Step 3: Wire into ReadingSidebar**

```typescript
import { ResourcesPanel } from './sidebar/ResourcesPanel';

// Replace resources placeholder:
{activeTab === 'resources' && (
  <ResourcesPanel bookId={bookId} chapter={chapter} bookName={bookName} />
)}
```

- [ ] **Step 4: Verify resources tab**

Open a chapter (e.g., 1. Mosebok 1), click "Ressurser" tab. Verify auto-search runs with book name. Verify expanding an item shows details. Verify "Les mer" links work.

- [ ] **Step 5: Commit**

```bash
git add src/components/bible/sidebar/ResourcesPanel.tsx src/components/bible/sidebar/ResourcesPanel.module.scss src/components/bible/ReadingSidebar.tsx
git commit -m "Add resources tab to reading sidebar with auto-search"
```

---

### Task 8: Drag resize

**Files:**
- Modify: `src/components/bible/ReadingSidebar.tsx`
- Modify: `src/components/bible/ReadingSidebar.module.scss`
- Modify: `src/components/bible/ChapterContent.tsx`
- Modify: `src/styles/pages/chapter.module.scss`

- [ ] **Step 1: Add resize handle to ReadingSidebar**

Add resize logic to `ReadingSidebar.tsx`. Add a drag handle on the left edge. On drag, update width. On double-click, toggle between stored width and 50%. Save width to settings.

Add these to the component:

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';

// Inside the component:
const sidebarRef = useRef<HTMLDivElement>(null);
const [isDragging, setIsDragging] = useState(false);
const [dragWidth, setDragWidth] = useState<number | null>(null);
const width = dragWidth ?? settings.sidebarWidth ?? 280;

// Disable drag in panel mode
const isPanelMode = settings.layoutMode === 'panel';

const handleMouseDown = useCallback((e: React.MouseEvent) => {
  if (isPanelMode) return;
  e.preventDefault();
  setIsDragging(true);
}, [isPanelMode]);

const handleDoubleClick = useCallback(() => {
  if (isPanelMode) return;
  const halfScreen = Math.floor(window.innerWidth / 2);
  const currentWidth = settings.sidebarWidth ?? 280;
  const newWidth = currentWidth >= halfScreen - 20 ? 280 : halfScreen;
  updateSetting('sidebarWidth', newWidth);
  setDragWidth(null);
}, [isPanelMode, settings.sidebarWidth, updateSetting]);

useEffect(() => {
  if (!isDragging) return;

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = Math.min(
      Math.max(200, window.innerWidth - e.clientX),
      Math.floor(window.innerWidth * 0.5)
    );
    setDragWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (dragWidth !== null) {
      updateSetting('sidebarWidth', dragWidth);
      setDragWidth(null);
    }
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
}, [isDragging, dragWidth, updateSetting]);
```

Update the render to include the handle and width style:

```typescript
return (
  <div
    ref={sidebarRef}
    className={styles.sidebar}
    style={isPanelMode ? undefined : { width: `${width}px` }}
  >
    {!isPanelMode && (
      <div
        className={`${styles.resizeHandle} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
    )}
    <div className={styles.tabs}>
      {/* ... tabs ... */}
    </div>
    <div className={styles.content}>
      {/* ... tab content ... */}
    </div>
  </div>
);
```

- [ ] **Step 2: Add resize handle styles**

Add to `ReadingSidebar.module.scss`:

```scss
.resizeHandle {
  position: absolute;
  left: -3px;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  transition: background $transition-fast;

  &:hover,
  &.dragging {
    background: $color-secondary;
    opacity: 0.3;
  }
}
```

Also update `.sidebar` to include `position: relative;` (it may already have it — if not, add it).

- [ ] **Step 3: Use CSS custom property for grid width**

In `ChapterContent.tsx`, pass the sidebar width as a CSS custom property on the layout div:

```typescript
<div
  className={styles.layout}
  style={{ '--sidebar-width': `${settings.sidebarWidth ?? 280}px` } as React.CSSProperties}
>
```

In `chapter.module.scss`, update the `.layout` grid:

```scss
.layout {
  display: grid;
  grid-template-columns: $sidebar-width 1fr var(--sidebar-width, #{$sidebar-width});
  min-height: 100vh;

  @include tablet {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Verify drag resize**

Open a chapter, drag the left edge of the sidebar. Verify:
- Width changes smoothly
- Width persists after page reload
- Double-click toggles between 280px and 50%
- Drag is disabled in panel mode

- [ ] **Step 5: Commit**

```bash
git add src/components/bible/ReadingSidebar.tsx src/components/bible/ReadingSidebar.module.scss src/components/bible/ChapterContent.tsx src/styles/pages/chapter.module.scss
git commit -m "Add drag resize to reading sidebar with double-click toggle"
```

---

### Task 9: Keyboard shortcuts

**Files:**
- Modify: `src/components/bible/ChapterKeyboardShortcuts.tsx`

- [ ] **Step 1: Add layout mode and tab shortcuts**

Import settings hook and add new key handlers. Add `updateSetting` to the component via `useSettings()`:

```typescript
import { useSettings } from '@/components/SettingsContext';
import type { SidebarTab } from '@/lib/settings';

// Inside the component:
const { settings, updateSetting } = useSettings();
```

Add these key handlers inside `handleKeyDown`, after the input field check and before the arrow key handlers:

```typescript
// Layout mode shortcuts (no modifiers)
if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
  e.preventDefault();
  updateSetting('layoutMode', 'normal');
  return;
}

if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
  e.preventDefault();
  updateSetting('layoutMode', 'reading');
  return;
}

if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
  e.preventDefault();
  updateSetting('layoutMode', 'panel');
  return;
}

// Tab switching 1-4 (no modifiers, no shift)
const tabMap: Record<string, SidebarTab> = {
  '1': 'timeline',
  '2': 'context',
  '3': 'resources',
  '4': 'lookup',
};

if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && tabMap[e.key]) {
  e.preventDefault();
  updateSetting('sidebarTab', tabMap[e.key]);
  return;
}
```

Note: The existing number key handler (1-9 for verse jumping) uses the same keys. The tab shortcuts (1-4) should take priority. Remove the existing verse-jumping handler for keys 1-4, or change it to only work with a modifier. The simplest approach: **remove the verse jump handler entirely** since users can click verse numbers or use URL hashes. If verse jumping is important to keep, use Shift+number instead — but check with the user first.

Alternative: Keep verse jumping for keys 5-9 and use 1-4 for tabs. Update the verse-jump regex from `/^[1-9]$/` to `/^[5-9]$/`.

- [ ] **Step 2: Update existing R shortcut in Header**

The Header currently has no R shortcut — it was in `KeyboardShortcuts.tsx`. Check if there's an existing R shortcut handler and remove it, since it's now handled in `ChapterKeyboardShortcuts`.

Search for existing reading mode keyboard shortcut:
```bash
grep -rn "readingMode\|'r'" src/components/KeyboardShortcuts.tsx
```

If found, remove it to avoid conflicts.

- [ ] **Step 3: Add settings and SidebarTab to useEffect dependencies**

Make sure `settings` and `updateSetting` are in the dependency array of the `useEffect`.

- [ ] **Step 4: Verify shortcuts work**

Open a chapter page:
- Press N → normal mode
- Press R → reading mode
- Press P → panel mode
- Press 1 → timeline tab
- Press 2 → context tab
- Press 3 → resources tab
- Press 4 → lookup tab
- Verify shortcuts don't fire when typing in search inputs

- [ ] **Step 5: Commit**

```bash
git add src/components/bible/ChapterKeyboardShortcuts.tsx
git commit -m "Add keyboard shortcuts for layout modes (N/R/P) and sidebar tabs (1-4)"
```

---

### Task 10: Mobile sidebar overlay

**Files:**
- Create: `src/components/bible/MobileSidebarOverlay.tsx`
- Create: `src/components/bible/MobileSidebarOverlay.module.scss`
- Modify: `src/components/bible/MobileToolbar.tsx`

- [ ] **Step 1: Create MobileSidebarOverlay**

Full-screen overlay with tabs, replacing `TimelineMobileOverlay` for the toolbar button:

```typescript
import { useState } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { TimelineMobileOverlay } from './TimelineMobileOverlay';
import { ContextPanel } from './sidebar/ContextPanel';
import { ResourcesPanel } from './sidebar/ResourcesPanel';
import { LookupPanel } from './sidebar/LookupPanel';
import type { SidebarTab } from '@/lib/settings';
import type { TimelineEvent } from '@/lib/bible';
import styles from './MobileSidebarOverlay.module.scss';

const tabs: { value: SidebarTab; label: string }[] = [
  { value: 'timeline', label: 'Tidslinje' },
  { value: 'context', label: 'Kontekst' },
  { value: 'resources', label: 'Ressurser' },
  { value: 'lookup', label: 'Oppslag' },
];

interface MobileSidebarOverlayProps {
  bookId: number;
  chapter: number;
  bookName: string;
  timelineEvents: TimelineEvent[];
  bookSummary: string | null;
  chapterSummary: string | null;
  historicalContext: string | null;
  onClose: () => void;
}

export function MobileSidebarOverlay({
  bookId,
  chapter,
  bookName,
  timelineEvents,
  bookSummary,
  chapterSummary,
  historicalContext,
  onClose,
}: MobileSidebarOverlayProps) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<SidebarTab>(settings.sidebarTab || 'timeline');

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.content}>
        {activeTab === 'timeline' && (
          <TimelineMobileOverlay
            events={timelineEvents}
            currentBookId={bookId}
            currentChapter={chapter}
            onClose={onClose}
            embedded
          />
        )}

        {activeTab === 'context' && (
          <ContextPanel
            bookId={bookId}
            chapter={chapter}
            bookName={bookName}
            bookSummary={bookSummary}
            chapterSummary={chapterSummary}
            historicalContext={historicalContext}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesPanel bookId={bookId} chapter={chapter} bookName={bookName} />
        )}

        {activeTab === 'lookup' && <LookupPanel />}
      </div>
    </div>
  );
}
```

Note: `TimelineMobileOverlay` needs an `embedded` prop to skip rendering its own header/close button when used inside the tabbed overlay. Add `embedded?: boolean` to its props and conditionally skip the header when `embedded` is true.

- [ ] **Step 2: Create MobileSidebarOverlay.module.scss**

```scss
@use '@/styles/variables' as *;

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $color-paper;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid $color-border;
  padding: 0 $spacing-sm;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  flex: 1;
  gap: 2px;
}

.tab {
  flex: 1;
  padding: $spacing-md $spacing-sm;
  border: none;
  background: transparent;
  font-size: $font-size-sm;
  color: $color-text-muted;
  cursor: pointer;
  border-bottom: 2px solid transparent;

  &.active {
    color: $color-primary;
    border-bottom-color: $color-secondary;
  }
}

.closeButton {
  padding: $spacing-md;
  border: none;
  background: transparent;
  font-size: $font-size-lg;
  color: $color-text-muted;
  cursor: pointer;

  &:hover {
    color: $color-text;
  }
}

.content {
  flex: 1;
  overflow-y: auto;
}

:global(html.dark) {
  .overlay {
    background: $dark-color-paper;
  }

  .header {
    border-bottom-color: $dark-color-border;
  }

  .tab {
    color: $dark-color-text-muted;

    &.active {
      color: $dark-color-primary;
      border-bottom-color: $dark-color-secondary;
    }
  }

  .closeButton {
    color: $dark-color-text-muted;

    &:hover {
      color: $dark-color-text;
    }
  }
}
```

- [ ] **Step 3: Add embedded prop to TimelineMobileOverlay**

In `src/components/bible/TimelineMobileOverlay.tsx`, add `embedded?: boolean` to the props interface. When `embedded` is true, skip rendering the header (close button) and outer wrapper — just render the scrollable timeline content directly.

- [ ] **Step 4: Update MobileToolbar to use MobileSidebarOverlay**

In `MobileToolbar.tsx`, replace the timeline button and `TimelineMobileOverlay` with a single sidebar button and `MobileSidebarOverlay`:

Replace the timeline button (lines 48-56) with:
```typescript
<button
  className={styles.sidebarButton}
  onClick={() => setShowTimeline(true)}
  title="Panel"
>
  ▥
</button>
```

Replace the timeline overlay (lines 84-91) with:
```typescript
{showTimeline && (
  <MobileSidebarOverlay
    bookId={bookId}
    chapter={chapter}
    bookName={bookName}
    timelineEvents={timelineEvents}
    bookSummary={null}
    chapterSummary={null}
    historicalContext={null}
    onClose={() => setShowTimeline(false)}
  />
)}
```

Note: `MobileToolbar` needs `bookName` prop and the context data. These need to be passed from `ChapterContent`. Update `MobileToolbarProps` to include `bookSummary`, `chapterSummary`, `historicalContext`, and pass them from `ChapterContent`.

- [ ] **Step 5: Verify mobile overlay**

Open in mobile viewport (or resize browser to <1024px). Tap the panel button. Verify:
- Full-screen overlay opens with tabs
- Can switch between all four tabs
- Timeline shows the same content as before
- Close button works

- [ ] **Step 6: Commit**

```bash
git add src/components/bible/MobileSidebarOverlay.tsx src/components/bible/MobileSidebarOverlay.module.scss src/components/bible/MobileToolbar.tsx src/components/bible/TimelineMobileOverlay.tsx src/components/bible/ChapterContent.tsx
git commit -m "Add tabbed mobile sidebar overlay replacing timeline-only overlay"
```

---

### Task 11: Clean up and polish

**Files:**
- Modify: `src/components/bible/ToolsPanel.tsx`
- Modify: `src/components/KeyboardShortcuts.tsx`
- Modify: various as needed

- [ ] **Step 1: Clean up KeyboardShortcuts.tsx**

Check `src/components/KeyboardShortcuts.tsx` for the existing `R` shortcut for reading mode. Remove it since it's now handled by `ChapterKeyboardShortcuts`. Keep other global shortcuts intact.

- [ ] **Step 2: Update ToolsPanel toggles**

Verify ToolsPanel no longer shows:
- `showBookSummary`
- `showChapterSummary`
- `showChapterContext`
- `showImportantWords`
- `showTimeline`

And now shows:
- `showContextInline` — "Vis kontekst i toppen"

Verify the remaining toggles work correctly.

- [ ] **Step 3: Handle readingMode backward compatibility**

In components that still reference `settings.readingMode`, update to use `settings.layoutMode === 'reading'`:

Search for all references:
```bash
grep -rn "readingMode\|settings\.readingMode" src/
```

Update each reference to use `settings.layoutMode === 'reading'`. Key files:
- `MobileToolbar.tsx` — the early return check
- `TimelinePanel.tsx` — the early return check
- `Summary.tsx` — the visibility check
- `ImportantWords.tsx` — the visibility check
- Any other components

- [ ] **Step 4: Verify everything works end-to-end**

Full test across all features:
- Layout modes via buttons and keyboard
- All four sidebar tabs with real content
- Drag resize with persistence
- Double-click to toggle 50%
- Mobile overlay with all tabs
- Settings persistence across page navigation
- Dark mode with all new components
- showContextInline toggle

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "Clean up readingMode references, finalize ToolsPanel and keyboard shortcuts"
```
