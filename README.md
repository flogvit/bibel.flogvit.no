# bibel.flogvit.com

Norsk bibel-nettside med oppslagsverk og verktøy for bibellesning.

## Teknologi

- **Frontend**: React + Vite med TypeScript
- **Backend**: Express API-server
- **Database**: SQLite (via better-sqlite3)
- **Styling**: SASS Modules
- **Offline**: Service Worker + IndexedDB

## Kom i gang

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver (frontend + API)
npm run dev

# Bygg for produksjon
npm run build

# Importer bibeldata til databasen
npm run import-bible
```

Frontend kjører på `http://localhost:3000`, API-kall proxyes til Express-backend på port 3018.

## Datakilder

Bibeldata importeres fra https://github.com/flogvit/free-bible/, `../free-bible/generate/`:

- Norsk bokmål (osnb2), nynorsk (osnn1)
- Gresk NT (SBLGNT), hebraisk GT (Tanach)
- Ord-for-ord oversettelser, kryssreferanser, sammendrag
- Temaer, profetier, tidslinje, leseplaner

## Funksjonalitet

- Bibellesning med grunntekst-visning (hebraisk/gresk)
- Ord-for-ord analyse med uttale og forklaring
- Kryssreferanser og tematiske oversikter
- Profetier med GT-referanser og NT-oppfyllelser
- Bibelsk tidslinje
- Leseplaner med streak-teller
- Favoritter, notater og emnetagging
- Søk i bibeltekst og originalspråk
- Offline-støtte med nedlasting av data
- Mørk/lys modus
