# Bibel.flogvit.com

## Prosjektbeskrivelse
En norsk bibel-nettside med oppslagsverk og verktøy for bibellesning. Bygget med Next.js og SQLite.

## Teknologi
- **Framework**: Next.js 15 med App Router
- **Database**: SQLite (via better-sqlite3) - `data/bible.db`
- **Styling**: SASS Modules (*.module.scss)
- **State**: localStorage for brukerinnstillinger og data
- **Autentisering**: NextAuth.js (planlagt)
- **Realtime**: Socket.io for sam-lesing (planlagt)

## Datakilder
All bibeldata hentes fra `../free-bible/generate/`:

### Bibler
- `bibles_raw/osnb1/[bok]/[kapittel].json` - Norsk bokmål (OSNB1)
- `bibles_raw/sblgnt/[bok]/[kapittel].json` - Gresk NT (SBL Greek New Testament)
- `bibles_raw/tanach/[bok]/[kapittel].json` - Hebraisk GT

### Tilleggsdata
- `word4word/osnb1/[bok]/[kapittel]/[vers].json` - Ord-for-ord oversettelse med originalspråk
- `references/[bok]/[kapittel]/[vers].json` - Kryssreferanser mellom bibeltekster
- `book_summaries/nb/[bok].txt` - Sammendrag av hver bok
- `chapter_summaries/nb/[bok]-[kapittel].txt` - Sammendrag av hvert kapittel
- `important_words/nb/[bok]-[kapittel].txt` - Viktige ord/begreper i kapittelet
- `themes/nb/[tema].json` - Tematiske oversikter med seksjoner og versreferanser
- `prophecies/prophecies.json` - Profetier og oppfyllelser (47 profetier i 7 kategorier)
- `timeline/timeline.json` - Bibelske hendelser (103 hendelser i 11 perioder)
- `reading_plans/` - Leseplaner (årlig, kronologisk, NT, etc.)

### Bokstruktur
- Bøker 1-39: Det gamle testamente (Tanach/hebraisk)
- Bøker 40-66: Det nye testamente (SBLGNT/gresk)

## Kommandoer
```bash
# Utvikling
npm run dev

# Bygg
npm run build

# Oppdater database fra generate/
npm run import-bible

# TypeScript (bruk alltid tsx)
npx tsx scripts/import.ts
```

## Mappestruktur
```
bibel.flogvit.no/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Forside med bokliste
│   │   ├── [book]/[chapter]/     # Bibelvisning
│   │   ├── sok/                  # Søk i bibeltekst
│   │   ├── sok/original/         # Søk i originalspråk
│   │   ├── temaer/               # Tematiske oversikter
│   │   ├── profetier/            # Profetier og oppfyllelser
│   │   ├── tidslinje/            # Bibelsk tidslinje
│   │   ├── leseplan/             # Leseplaner
│   │   ├── emner/                # Brukerens emnetagging
│   │   ├── favoritter/           # Favorittvers
│   │   ├── kjente-vers/          # Kjente bibelvers
│   │   ├── tekst/                # Vis flere passasjer
│   │   ├── om/                   # Om-side
│   │   └── api/                  # API-ruter
│   ├── components/               # React-komponenter
│   │   └── bible/                # Bibelspesifikke komponenter
│   └── lib/
│       ├── db.ts                 # SQLite database
│       ├── bible.ts              # Bibel-hjelpefunksjoner
│       └── settings.ts           # Brukerinnstillinger (localStorage)
├── scripts/
│   └── import-bible.ts           # Importskript for database
└── data/
    └── bible.db                  # SQLite database
```

## API-endepunkter
- `GET /api/verses?refs=1mo-1-1,joh-3-16` - Hent flere vers
- `GET /api/books` - Bokliste
- `GET /api/prophecies` - Profetier og oppfyllelser
- `GET /api/timeline` - Tidslinjehendelser

## Database-skjema
**Bibeldata:**
- `books` - Bokliste med norske og engelske navn
- `verses` - Alle vers med tekst og metadata
- `word4word` - Ord-for-ord data
- `references` - Kryssreferanser
- `book_summaries` - Boksammendrag
- `chapter_summaries` - Kapittelsammendrag
- `important_words` - Viktige ord per kapittel
- `themes` - Tematiske oversikter

**Studiebibel:**
- `prophecy_categories` - Profetikategorier
- `prophecies` - Profetier med GT-referanser
- `prophecy_fulfillments` - NT-oppfyllelser
- `timeline_periods` - Tidslinjeperioder
- `timeline_events` - Tidslinjehendelser
- `timeline_references` - Referanser til hendelser
- `reading_plans` - Leseplaner

## Funksjoner

### Bibellesing
- Klikk på versnummer → referanser, bønn, andakt
- Klikk på ord → originalord, uttale, forklaring (word4word)
- Grunntekst-visning (hebraisk/gresk) under vers
- Vers-anker: `/[bok]/[kapittel]#v5`

### Hjelpemidler (ToolsPanel)
- Boksammendrag, kapittelsammendrag, viktige ord
- Tidslinje-sidebar (viser relevante hendelser)
- Skriftstørrelse (liten/medium/stor)
- Mørk/lys modus

### Brukerdata (localStorage)
- Favorittvers
- Emnetagging av vers
- Leseplan-progresjon med streak-teller
- Innstillinger (showSummary, showOriginal, theme, etc.)

## Apache-konfigurasjon
Kjør Next.js bak Apache som reverse proxy:
```apache
<VirtualHost *:80>
    ServerName bibel.flogvit.no
    ProxyPass / http://localhost:3018/
    ProxyPassReverse / http://localhost:3018/
</VirtualHost>
```

## Utviklingsprinsipper
- **KISS** - Keep It Simple, Stupid. Enkleste løsning som fungerer.
- **DRY** - Don't Repeat Yourself. Gjenbruk kode, unngå duplisering.

## Designretningslinjer
Basert på books.flogvit.com - moderne, stilrent, behagelig.

### Farger
```scss
$color-primary: #2c3e50;      // Mørk blågrå - overskrifter
$color-secondary: #8b7355;    // Varm brun - lenker
$color-accent: #c9a959;       // Gull - aksentfarge
$color-background: #faf8f5;   // Varm off-white - bakgrunn
$color-paper: #ffffff;        // Hvit - kort/paneler
$color-text: #333333;         // Mørk grå - brødtekst
$color-text-muted: #999999;   // Lys grå - sekundær tekst
$color-border: #e5e0d8;       // Varm grå - kantlinjer
```

### Typografi
- **Overskrifter**: Georgia, serif (font-weight: 400)
- **Brødtekst**: Segoe UI, Helvetica Neue, sans-serif
- **Linjehøyde**: 1.6 for tekst, 1.3 for overskrifter

### Stilelementer
- Ingen gradienter
- Subtile skygger (box-shadow med lav opacity)
- Avrundede hjørner (4-12px)
- God whitespace/spacing
- Myk hover-effekt på interaktive elementer

## Viktige regler
- Bruk alltid `tsx` for TypeScript, ikke `ts-node`
- Aldri overskrive filer med cp/mv uten å spørre
- Ikke lag forklarende markdown-filer
- Oppdater TODO.md når oppgaver fullføres (se også DONE.md)
- Ingen hardkodede testverdier i koden

## localStorage-nøkler
- `favorites` - Favorittvers (array av refs)
- `topics` - Emnetagging (objekt med topic → vers-array)
- `activeReadingPlan` - Aktiv leseplan-ID
- `readingPlanProgress` - Leseplan-progresjon
- `settings` - Brukerinnstillinger (theme, fontSize, showSummary, etc.)
