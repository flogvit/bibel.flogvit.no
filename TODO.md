# TODO - Bibel.flogvit.com

Se DONE.md for fullførte oppgaver.

## Fase 8: Sam-lesing (fremtidig)
- [ ] WebSocket-server for realtime
- [ ] Opprett sesjon som taler
- [ ] Delta i sesjon som tilhører
- [ ] Synkronisert visning

## Fase 9: Brukerkontoer (fremtidig)
- [ ] Autentisering (NextAuth.js eller lignende)
- [ ] Brukerregistrering/innlogging
- [ ] Lagre personlige innstillinger i database
- [ ] Lesehistorikk
- [ ] Emnetagging database-versjon (med innlogging, users.db)

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

## Andaktsmodul

En modul for å skrive, organisere og koble andakter/taler til bibeltekst.

### Kjernefunksjonalitet
- [ ] Andakter i Markdown-format (.md) med frontmatter (tittel, dato, tags, etc.)
- [ ] Bibelvers-referanser i andakter (f.eks. `[vers:joh-3-16]`) som rendres som stilige vers-komponenter
- [ ] Andaktsliste/arkiv med søk og filtrering
- [ ] Kobling vers → andakter: fra et vers, se alle andakter som bruker det verset
- [ ] Kobling andakt → vers: fra en andakt, klikk deg direkte til bibelteksten

### Skrivemodus
- [ ] Markdown-editor med live preview
- [ ] Enkel innsetting av bibelvers (søk/velg vers → settes inn som referanse)
- [ ] Auto-complete for versreferanser mens man skriver
- [ ] Støtte for tags/emner på andakter

### Navigasjon og oppdagelse
- [ ] Fra bibellesing: "Se andakter som bruker dette verset" (lenke i vers-popup eller ToolsPanel)
- [ ] Fra andakt: klikk på vers-referanse → hopp til bibeltekst, eller vis vers inline
- [ ] Relaterte andakter (basert på felles vers eller tags)
- [ ] Tidslinje/kalender-visning av andakter

### Lagring og format
- [ ] Markdown-filer med YAML frontmatter:
  ```yaml
  ---
  title: "Nådens kraft"
  date: 2025-01-15
  tags: [nåde, frelse, tro]
  verses: [joh-3-16, rom-8-28, ef-2-8]
  type: andakt | tale | bibelstudium
  ---
  ```
- [ ] Indeksering av vers-referanser i database for rask oppslag
- [ ] Lokal lagring først, evt. synkronisering med brukerkonto senere

### Synkronisering (desktop → iPad/mobil)
- [ ] Skrive andakter på desktop, hente opp på iPad under preken
- [ ] Skybasert sync (ikke eksport/import) - sømløs og automatisk
- [ ] Krever brukerkonto (kobles til Fase 9)
- [ ] Offline-støtte: andakter caches lokalt, synkes når nett er tilgjengelig
- [ ] Konfliktshåndtering ved endring på flere enheter

### Teknisk
- [ ] Ny rute: `/andakter/` (liste), `/andakter/[slug]` (les), `/andakter/ny` (skriv)
- [ ] API: `/api/andakter`, `/api/andakter/by-verse?ref=joh-3-16`
- [ ] Markdown-parser med custom bibelvers-plugin (rendrer `[vers:...]` som VerseDisplay-komponent)
- [ ] Database-tabell for andakt-metadata og vers-koblinger

## Desktop-app (Electron)

Pakke appen som standalone desktop-app for macOS, Windows og Linux.

### Hvorfor Electron
- Eksisterende arkitektur (Vite/React SPA + Express API + SQLite) passer nesten 1:1
- Express-serveren kan kjøre direkte i Electron sin main process
- better-sqlite3 fungerer i Electron (med `electron-rebuild`)
- React SPA lastes i BrowserWindow
- IndexedDB/localStorage fungerer uendret (Chromium under panseret)

### Minimalt oppsett
- [ ] Installer `electron` + `electron-builder`
- [ ] Lag `electron/main.ts`:
  - Start Express-serveren (embed `api/server.ts`)
  - Åpne `BrowserWindow` som peker på Express-serveren
  - Bundle `data/bible.db` med appen
- [ ] `electron-rebuild` for å rekompilere `better-sqlite3` mot Electron sin Node-versjon
- [ ] Konfigurer `electron-builder` for macOS (.dmg), Windows (.exe/.msi), Linux (.AppImage/.deb)

### Tilpasninger
- [ ] DB-path: Endre fra `process.cwd()` til `process.resourcesPath` (for bundlet DB) og `app.getPath('userData')` (for bruker-DB)
- [ ] Port-håndtering: Start Express på tilfeldig ledig port, eller bruk Electron sin `protocol.handle()` for å kjøre uten HTTP
- [ ] Native menylinje for Mac/Windows/Linux
- [ ] Auto-oppdatering via `electron-updater`

### Brukerdata
- IndexedDB + localStorage fungerer uten endring i Electron
- Data lagres i Electron sin Chromium-profil (`~/Library/Application Support/Bibel/` på Mac)
- Valgfritt: Flytte brukerdata til SQLite (users.db) for enklere backup/eksport og fremtidig synkronisering

### Ting som fungerer uten endring
- All frontend-kode (React, SCSS, routing)
- All API-kode (Express routes)
- SQLite-database (better-sqlite3)
- Brukerdata (IndexedDB/localStorage via `src/lib/offline/userData.ts`)

## Bugs/Forbedringer
- [ ] Tidslinjen i lesemodus: kompaktere design, kollapsbare perioder, evt. 2-kolonners layout
- [ ] Tidslinjen generelt: vurder kompaktere event-kort, bok-kolonne bak toggle
