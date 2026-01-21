# Bibel.flogvit.com

## Prosjektbeskrivelse
En norsk bibel-nettside med oppslagsverk og verktøy for bibellesning. Bygget med Next.js og SQLite.

## Teknologi
- **Framework**: Next.js 15 med App Router
- **Database**: SQLite (via better-sqlite3) - to databaser:
  - `data/bible.db` - Bibeldata (read-only, kan oppdateres separat)
  - `data/users.db` - Brukerdata (read-write)
- **Styling**: SASS Modules (*.module.scss)
- **Autentisering**: NextAuth.js (planlagt)
- **Realtime**: Socket.io for sam-lesing (planlagt)

## Datakilder
All bibeldata hentes fra `../free-bible/generate/`:

### Bibler
- `bibles_raw/osnb1/[bok]/[kapittel].json` - Norsk bokmål (OSNB1)
- `bibles_raw/sblgnt/[bok]/[kapittel].json` - Gresk NT (SBL Greek New Testament)
- `bibles_raw/tanach/[bok]/[kapittel].json` - Hebraisk GT

### Tilleggsdata
- `word4word/osnb1/[bok]/[kapittel]/[vers].json` - Ord-for-ord oversettelse med originalspråk og forklaringer
- `references/[bok]/[kapittel]/[vers].json` - Kryssreferanser mellom bibeltekster
- `book_summaries/nb/[bok].txt` - Sammendrag av hver bok
- `chapter_summaries/nb/[bok]-[kapittel].txt` - Sammendrag av hvert kapittel
- `important_verses/verses.txt` - Liste over viktige/kjente bibelvers
- `important_words/nb/[bok]-[kapittel].txt` - Viktige ord/begreper i kapittelet med forklaringer
- `themes/nb/[tema].txt` - Tematiske oversikter (f.eks. evangeliene.txt)
- `verse_prayer/nb/[bok]-[kapittel]-[vers].txt` - Bønn basert på verset
- `verse_sermon/nb/[bok]-[kapittel]-[vers].txt` - Andakt/preken basert på verset

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
bibel.flogvit.com/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Forside
│   ├── [bok]/[kapittel]/     # Bibelvisning
│   └── api/                  # API-ruter
├── components/               # React-komponenter
│   └── bible/                # Bibelspesifikke komponenter
├── lib/
│   ├── db.ts                 # SQLite database
│   └── bible.ts              # Bibel-hjelpefunksjoner
├── scripts/
│   └── import-bible.ts       # Importskript for database
└── data/
    └── bible.db              # SQLite database
```

## Database-skjema
- `books` - Bokliste med norske og engelske navn
- `verses` - Alle vers med tekst og metadata
- `word4word` - Ord-for-ord data
- `references` - Kryssreferanser
- `book_summaries` - Boksammendrag
- `chapter_summaries` - Kapittelsammendrag

## Visningsfunksjoner
Fra eksisterende klient (../free-bible/client):
- Klikk på versnummer for å vise:
  - Original tekst (hebraisk/gresk)
  - Referanser til andre vers
- Klikk på ord for å vise:
  - Originalord (hebraisk/gresk)
  - Uttale (for gresk)
  - Forklaring

## Apache-konfigurasjon
Kjør Next.js bak Apache som reverse proxy:
```apache
<VirtualHost *:80>
    ServerName bibel.flogvit.com
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
- Oppdater TODO.md når oppgaver fullføres
- Ingen hardkodede testverdier i koden
