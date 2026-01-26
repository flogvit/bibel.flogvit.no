# TODO - Bibel.flogvit.com

Se DONE.md for fullførte oppgaver.

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

## Fase 10: Offline-støtte og IndexedDB (fremtidig)

### IndexedDB for brukerdata
- [ ] Migrere fra localStorage til IndexedDB (med Dexie.js)
- [ ] Universell tagging - tagge alle typer innhold (vers, notater, profetier, tidslinje, leseplaner)
- [ ] Eksport/import av all brukerdata fra IndexedDB

### PWA og Service Worker
- [ ] Sett opp next-pwa eller manuell service worker
- [ ] Cache alle statiske assets (HTML, JS, CSS)
- [ ] Manifest-fil for installerbar app

### Bibeldata offline
- [ ] Last ned all bibeldata til IndexedDB ved første besøk (~25-30 MB)
- [ ] Offline-first: les fra IndexedDB, fallback til API
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
| Parallelle tekster (synoptikerne) | Eksterne datasett | `sync_gospels.mjs` | `parallel_texts/` |

### Eksterne kilder
| Funksjon | Mulige kilder |
|----------|---------------|
| Geografisk info med kart | OpenBible.info (koordinater), Leaflet/OpenStreetMap |
| Lydbibel-integrasjon | Må finne åpen kilde eller lisensiert innhold |
| Bilder og illustrasjoner | Public domain bilder, eller lisensiert |

### Frontend-funksjoner
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
