# Reading Sidebar Redesign

## Overview

Replace the fixed timeline-only right sidebar in the bible reading view with a tabbed, resizable sidebar offering multiple tools. Add three layout modes controlled from the header.

## Layout Modes

Three modes, toggled via header icons and keyboard shortcuts. Stored in `localStorage` as `layoutMode`.

| Mode | Shortcut | Grid | Description |
|------|----------|------|-------------|
| `normal` | N | `280px 1fr <sidebarWidth>` | Left sidebar + text + right sidebar |
| `reading` | R | `1fr` | Text only (replaces existing reading mode) |
| `panel` | P | `1fr 1fr` | 50/50 text + right sidebar, no left sidebar |

### Header Controls

Three toggle icons in the header (radio-button style), replacing the current reading mode button:
- Normal icon (three columns)
- Reading icon (one column)
- Panel icon (two columns, 50/50)

## Right Sidebar: `ReadingSidebar`

New component replacing the current `<TimelinePanel>` in the right sidebar slot.

### Tabs

4 tabs with keyboard shortcuts (1-4, disabled when focus is in a text input):

| Tab | Key | Content |
|-----|-----|---------|
| Tidslinje | 1 | Existing `TimelinePanel` wrapped |
| Kontekst | 2 | Book summary, chapter summary, historical context, important words |
| Ressurser | 3 | Persons, prophecies, themes, parallels related to the chapter |
| Oppslag | 4 | Verse lookup without navigating away |

- Active tab stored in `localStorage` (`sidebarTab`)
- Tab buttons as horizontal row at top of sidebar, similar to devotional editor design

### Tab Details

**Tidslinje:** Wraps existing `TimelinePanel` with no behavioral changes.

**Kontekst:**
- Content moved FROM the main article area (book summary, chapter summary, historical context, important words)
- Displayed as collapsible sections, open by default
- New setting `showContextInline` (default `false`) in ToolsPanel: "Vis også i toppen" — shows them back in the main area as well
- Uses existing data already fetched by `useChapter` hook

**Ressurser:**
- Automatically shows resources related to the current chapter (not search-first)
- Adapted from `ResourceSearchPanel` but without insert functionality
- Click expands/shows details
- Links to relevant pages (person page, theme page, etc.)
- Resource types: persons, prophecies, themes, parallels, timeline events, important words

**Oppslag:**
- Adapted from `BibleLookupPanel` but without insert functionality
- Results displayed inline in the panel
- Retains original language text and word-for-word display

### Drag Resize

- Drag handle on the left edge of the right sidebar
- Min width: 200px, max width: 50% of viewport
- Double-click handle: toggle between stored width and 50%
- Width stored in `localStorage` (`sidebarWidth`)
- Drag disabled in `panel` mode (always 50/50)
- Default width: 280px (matching current `$sidebar-width`)

## Mobile

- Both sidebars hidden below 1024px (unchanged)
- Existing timeline button in `MobileToolbar` opens the full tabbed panel as overlay instead of just timeline
- Users can switch between all 4 tabs in the overlay
- Timeline remains the default tab

## Settings Changes

### New Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layoutMode` | `'normal' \| 'reading' \| 'panel'` | `'normal'` | Active layout mode |
| `sidebarTab` | `'timeline' \| 'context' \| 'resources' \| 'lookup'` | `'timeline'` | Active sidebar tab |
| `sidebarWidth` | `number` | `280` | Sidebar width in pixels |
| `showContextInline` | `boolean` | `false` | Also show context sections in main area |

### Removed/Changed Settings

- `readingMode` boolean → replaced by `layoutMode === 'reading'`
- `showTimeline` toggle → replaced by sidebar tab selection (timeline is just one tab now)
- `showBookSummary`, `showChapterSummary`, `showChapterContext`, `showImportantWords` → these now control whether content appears in the Kontekst tab sections (always available), but their inline display is controlled by `showContextInline`

## Components

### New Components

- `src/components/bible/ReadingSidebar.tsx` — main tabbed sidebar container with drag resize
- `src/components/bible/ReadingSidebar.module.scss` — styles
- `src/components/bible/sidebar/ContextPanel.tsx` — context tab content
- `src/components/bible/sidebar/ResourcesPanel.tsx` — resources tab content (adapted from devotional ResourceSearchPanel)
- `src/components/bible/sidebar/LookupPanel.tsx` — verse lookup tab content (adapted from devotional BibleLookupPanel)
- `src/components/bible/LayoutModeButtons.tsx` — header toggle icons

### Modified Components

- `ChapterContent.tsx` — replace `<TimelinePanel>` with `<ReadingSidebar>`, add layout mode support, conditionally render context sections based on `showContextInline`
- `chapter.module.scss` — add grid variants for three layout modes
- `Header.tsx` — add layout mode toggle buttons (only on chapter pages)
- `MobileToolbar.tsx` — change timeline button to open full tabbed overlay
- `TimelineMobileOverlay.tsx` — extend to support all tabs (or replace with new overlay)
- `ToolsPanel.tsx` — add `showContextInline` toggle, remove individual summary toggles from inline display, remove `showTimeline` toggle
- `ChapterKeyboardShortcuts.tsx` — add N, P shortcuts, add 1-4 for tab switching
- `settings.ts` — add new settings, handle migration from `readingMode` to `layoutMode`

## Future (v2)

- **Manuskripter-fane** (tab 5) — shows devotionals related to current chapter. Requires reference indexing in IndexedDB. Deferred until reference structure is finalized.
