# TODO - Bibel.flogvit.com

Se DONE.md for fullførte oppgaver.

## Fase 7: Migrering til Vite + React SPA (aktiv)

Migrere fra Next.js til Vite + React Router for bedre offline-støtte.
Next.js server-rendrer HTML per route, som gjør offline komplisert.
Med Vite får vi én index.html som fungerer for alle routes offline.

### Struktur
```
bibel/
├── src/                    # React frontend
│   ├── components/         # Eksisterende komponenter (gjenbrukes)
│   ├── pages/              # Route-komponenter
│   ├── hooks/              # Eksisterende hooks (gjenbrukes)
│   ├── lib/                # Utilities, offline-logikk
│   ├── App.tsx             # React Router oppsett
│   └── main.tsx            # Entry point
├── api/                    # Express backend
│   ├── routes/             # API routes
│   ├── server.ts           # Express server
│   └── db.ts               # SQLite tilkobling
├── public/
│   ├── sw.js               # Service worker
│   └── manifest.json
├── index.html              # Én HTML entry
└── vite.config.ts
```

### Steg 1: Sett opp Vite-prosjekt
- [ ] Opprett ny Vite + React + TypeScript konfigurasjon
- [ ] Konfigurer Vite for SCSS modules
- [ ] Konfigurer path aliases (@/)
- [ ] Sett opp React Router

### Steg 2: Migrer frontend
- [ ] Kopier alle komponenter fra src/components/
- [ ] Kopier alle hooks fra src/hooks/
- [ ] Kopier lib/ utilities
- [ ] Kopier styles/ og SCSS variabler
- [ ] Opprett route-komponenter i pages/
- [ ] Sett opp App.tsx med React Router routes

### Steg 3: Sett opp Express API
- [ ] Opprett Express server med TypeScript
- [ ] Migrer API routes fra Next.js:
  - [ ] /api/books
  - [ ] /api/chapter
  - [ ] /api/verses
  - [ ] /api/timeline
  - [ ] /api/prophecies
  - [ ] /api/persons
  - [ ] /api/reading-plans
  - [ ] /api/search
  - [ ] /api/version
- [ ] Sett opp SQLite-tilkobling
- [ ] Konfigurer CORS for utvikling

### Steg 4: Service Worker og Offline
- [ ] Oppdater service worker for ny struktur
- [ ] Cache index.html og alle statiske filer
- [ ] Behold IndexedDB-logikk for API-data
- [ ] Test offline-funksjonalitet

### Steg 5: Opprydding
- [ ] Fjern Next.js avhengigheter
- [ ] Fjern unødvendige filer (app/, offline-fallback, etc.)
- [ ] Oppdater package.json scripts
- [ ] Oppdater deployment-konfigurasjon

## Fase 8: Sam-lesing (fremtidig)
- [ ] WebSocket-server for realtime
- [ ] Opprett sesjon som taler
- [ ] Delta i sesjon som tilhører
- [ ] Synkronisert visning

## Fase 9: Brukerkontoer (fremtidig)
- [ ] NextAuth.js oppsett
- [ ] Brukerregistrering/innlogging
- [ ] Lagre personlige innstillinger i database
- [ ] Bokmerkefunksjon
- [ ] Lesehistorikk
- [ ] Notater på vers
- [ ] Emnetagging database-versjon (med innlogging, users.db)

## Fase 10: Offline-støtte og IndexedDB (dekkes av Fase 7)

> **Merk:** Mesteparten av dette er allerede implementert eller dekkes av migreringen i Fase 7.

### IndexedDB for brukerdata
- [x] IndexedDB oppsett (idb-keyval)
- [ ] Migrere fra localStorage til IndexedDB
- [ ] Universell tagging - tagge alle typer innhold
- [ ] Eksport/import av all brukerdata fra IndexedDB

### PWA og Service Worker
- [x] Service worker implementert
- [x] Cache statiske assets
- [x] Manifest-fil for installerbar app
- [ ] Forbedres i Fase 7 med Vite

### Bibeldata offline
- [x] Last ned bibeldata til IndexedDB
- [x] Offline-first: les fra IndexedDB, fallback til API
- [ ] Bakgrunnssynkronisering når online

## Studiebibel-funksjoner

### Ordstudier
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Ordhistorie og etymologi | `.json` | `word_etymology.mjs` | `word_etymology/` |
| Semantiske felt (relaterte ord) | `.json` | `word_relations.mjs` | `word_relations/` |

### Teologi og tolkning
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Doktrinær oversikt per tema | `.md` | (inkl. i themes.mjs) | `themes/nb/` |
| Typologi (GT→NT) | `.json` | `typology.mjs` | `typology/` |
| Guds attributter vs. menneskers | `.json` | `divine_attributes.mjs` | `divine_attributes/nb/` |

### Personlig bibelstudium
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Spørsmål til refleksjon | `.json` | `reflection_questions.mjs` | `reflection_questions/nb/` |
| Applikasjoner for dagliglivet | `.json` | `applications.mjs` | `applications/nb/` |

### Oppslagsverk
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Personprofiler (bibelske karakterer) | `.md` | `bible_persons.mjs` | `persons/nb/` |
| Stedsoversikt med beskrivelser | `.md` | `bible_places.mjs` | `places/nb/` |
| Symboler og billedspråk forklart | `.md` | `symbols.mjs` | `symbols/nb/` |
| Bibelsk ordbok/leksikon | `.md` | `bible_dictionary.mjs` | `dictionary/nb/` |

### Beregnes fra eksisterende data
| Funksjon | Kilde | Skript | Output |
|----------|-------|--------|--------|
| Konkordans | word4word + verses | `build_concordance.mjs` | `concordance/` |

### Eksterne kilder
| Funksjon | Mulige kilder |
|----------|---------------|
| Geografisk info med kart | OpenBible.info (koordinater), Leaflet/OpenStreetMap |
| Lydbibel-integrasjon | Må finne åpen kilde eller lisensiert innhold |
| Bilder og illustrasjoner | Public domain bilder, eller lisensiert |

### Frontend-funksjoner
- [ ] Dagens vers (verse of the day) på forsiden
- [ ] Bibelvers-memorering med repetisjon (spaced repetition)
- [ ] Studienotater (brukerdata i users.db, krever innlogging)
- [ ] Kart for bibelske reiser (Leaflet-komponent med koordinater fra places/)

## Data-generering (../free-bible/generate/)

### Ufullstendig data
| Datatype | Status | Filer | Skript |
|----------|--------|-------|--------|
| references | ⚠️ Delvis | 3,457 | `references.mjs` |
| important_verses | ❌ Minimal | 1 | Mangler |
| themes | ❌ Minimal | 1 | Mangler |
| verse_prayer | ❌ Minimal | 4 | Mangler |
| verse_sermon | ❌ Minimal | 5 | Mangler |

### Skript som må lages
- themes.mjs - Tematiske oversikter
- verse_prayer.mjs - Bønn basert på vers
- verse_sermon.mjs - Andakt/preken basert på vers
- important_verses2json.mjs - Konvertere til JSON

### Skript som må kjøres videre
references.mjs - Kryssreferanser (mangler bøker 2-39 og 43-66)

## Data
- [ ] Generere norsk word4word-data for alle bøker (mangler for de fleste GT-bøker)

## WCAG 2.2 AA - Gjenstående testing
- [ ] Testing med skjermleser (VoiceOver, NVDA)
- [ ] Manuell testing med tastatur
- [ ] Lighthouse accessibility audit

## Bugs/Forbedringer
- (ingen kjente)
