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
  - Bibeltekst (OSNB1, SBLGNT, Tanach)
  - Word4word data
  - Referanser og sammendrag
  - Profetier og tidslinje
- [ ] Offline-first: les fra IndexedDB, fallback til API
- [ ] Bakgrunnssynkronisering når online

### Fordeler
- Fungerer helt uten nett
- Installerbar på mobil/desktop
- Raskere etter første besøk
- Push-varsler for leseplan-påminnelser (valgfritt)

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
| Leseplaner | Egen logikk | `reading_plans.mjs` | `reading_plans/` |

**Leseplaner (egenproduserte):**
- Årlig (365 dager) - 1189 kapitler fordelt jevnt, GT+NT hver dag
- Kronologisk - basert på bibelens egen kronologi
- NT på 9 uker - 260 kapitler / 4 per dag
- Salmene (150 dager)
- Ordspråkene (31 dager)
- Evangeliene parallelt (synoptisk lesing)
- Tematiske: Påske, Jul, Faste, etc.

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

#### 1. themes.mjs - Tematiske oversikter
Generere temabaserte bibelstudier i Markdown-format.

**Foreslåtte temaer:**
- **Teologiske**: Skapelsen, Synden, Frelsen, Nåde, Tilgivelse, Rettferdighet, Tro, Håp, Kjærlighet
- **Doktriner**: Pakten, Den hellige ånd, Engler, Djevelen, Endetiden, Oppstandelsen
- **Praktisk liv**: Bønn, Familie, Ekteskap, Arbeid, Penger, Lidelse, Død, Frykt, Glede
- **Karakterer**: Abraham, Moses, David, Jesus, Paulus
- **Bøker**: Bergprekenen, De ti bud, Lignelsene, Salmene

**Format:** `themes/nb/[tema-slug].md`

#### 2. verse_prayer.mjs - Bønn basert på vers
Generere bønner inspirert av bibelvers i JSON-format.

**Format:** `verse_prayer/nb/[bok]-[kapittel]-[vers].json`

#### 3. verse_sermon.mjs - Andakt/preken basert på vers
Generere korte andakter (300-500 ord) i JSON-format.

**Format:** `verse_sermon/nb/[bok]-[kapittel]-[vers].json`

#### 4. important_verses2json.mjs - Konvertere til JSON
Konvertere `important_verses/verses.txt` til strukturert JSON.

**Format:** `important_verses/verses.json`

### Skript som må kjøres videre

#### references.mjs - Kryssreferanser
Dekker kun: Bok 1 (1 Mosebok), 40 (Matteus), 41 (Markus), 42 (Lukas delvis)
- [ ] Kjøre for bøker 2-39 (GT)
- [ ] Kjøre for bøker 43-66 (resten av NT)

**Merk**: Bruker OpenAI API (gpt-4-turbo-preview), ~27,000 vers gjenstår.

### Notater om skript

**Eksisterende skript (OpenAI):**
- Bruker OpenAI/ChatGPT API (gpt-4, gpt-4-turbo-preview)
- Krever `OPENAI_API_KEY` i `.env`
- Skriptene har innebygget fortsett-logikk (hopper over eksisterende filer)
- Kjøres med: `node [skript].mjs <translation> <bookId> [chapterId]`

**Nye skript (Anthropic):**
- Skal bruke Anthropic Claude API (claude-opus-4-5-20251101)
- Krever `ANTHROPIC_API_KEY` i `.env`
- Bruk @anthropic-ai/sdk for Node.js

## Data
- [ ] Generere norsk word4word-data for alle bøker (mangler for de fleste GT-bøker)

## WCAG 2.2 AA Tilgjengelighet

Mål: Full WCAG 2.2 AA-støtte for alle brukere.

### Oppfattbar (Perceivable)

#### Tekstalternativer
- [x] Alt-tekst på alle bilder og ikoner (ingen bilder i prosjektet, ikoner har aria-hidden)
- [x] Beskrivende aria-labels på interaktive elementer

#### Tilpasbarhet
- [x] Semantisk HTML (header, nav, main, article, aside, footer)
- [x] Korrekt overskriftshierarki (h1-h6)
- [x] Landmark-regioner med aria-labels
- [x] Skip-link til hovedinnhold

#### Distinguerbart
- [x] Kontrastsjekk alle fargekombinasjoner (minimum 4.5:1 for tekst, 3:1 for stor tekst) - versnummer #0066aa
- [x] Tekst kan forstørres 200% uten tap av funksjonalitet (alle størrelser i rem)
- [x] Støtte for brukerens foretrukne fargevalg (prefers-color-scheme, prefers-contrast)
- [x] Støtte for prefers-reduced-motion
- [x] Ingen informasjon kun formidlet via farge (ikoner/symboler i tillegg til farge)

### Betjenbar (Operable)

#### Tastaturnavigasjon
- [x] Alle funksjoner tilgjengelig via tastatur
- [x] Synlig fokusindikator på alle interaktive elementer
- [x] Logisk tab-rekkefølge
- [x] Ingen tastaturfeller
- [x] Fokus ikke skjult bak sticky elementer (2.4.11 - nytt i 2.2)
- [x] Hurtigtaster implementert (?, piltaster, Alt+Shift+bokstav)

#### Navigasjon
- [x] Konsistente navigasjonsmekanismer (breadcrumbs på alle sider)
- [x] Flere måter å finne innhold (søk, meny, sitemap)
- [x] Beskrivende lenketekster (aria-labels på MobileToolbar)
- [x] Breadcrumbs for orientering (lagt til på alle sider)
- [x] Fokus-håndtering ved sidenavigasjon (SPA) - NavigationAnnouncer

#### Inndatametoder (nytt i 2.2)
- [x] Target size minimum 24x24px for klikkbare elementer (2.5.8)
- [x] Alternativ til dra-og-slipp operasjoner (2.5.7) (ingen dra-og-slipp i prosjektet)

### Forståelig (Understandable)

#### Lesbarhet
- [x] Språk definert i HTML (lang="nb")
- [x] Språkendringer markert (hebraisk/gresk tekst med lang-attributt)
- [x] Forkortelser forklart (abbr-tag for "kap.")

#### Forutsigbarhet
- [x] Konsistent plassering av UI-elementer (Header, Footer, Breadcrumbs på alle sider)
- [x] Ingen uventede kontekstendringer ved fokus/input (alle endringer er bruker-initierte)
- [x] Konsistent hjelp tilgjengelig (3.2.6 - nytt i 2.2) (Hjelp-lenke i Footer → /om#hjelp)

#### Inndatahjelp
- [x] Tydelige feilmeldinger (norske beskrivende meldinger)
- [x] Labels for alle skjemafelt (aria-label på alle input/textarea)
- [x] Instruksjoner der nødvendig (placeholder-tekster, tom-tilstand-beskjeder)
- [x] Redundant Entry - unngå å be om samme info flere ganger (3.3.7 - nytt i 2.2)

### Robust

#### Kompatibilitet
- [x] Validert HTML (build uten feil)
- [x] ARIA brukt korrekt (roller, tilstander, egenskaper)
- [x] Statusmeldinger annonsert til skjermlesere (aria-live)
- [ ] Testing med skjermleser (VoiceOver, NVDA)

### Verktøy og testing
- [x] Sett opp eslint-plugin-jsx-a11y (inkludert i eslint-config-next)
- [x] Legg til axe-core for automatisk testing (AxeAccessibility-komponent)
- [ ] Manuell testing med tastatur
- [ ] Manuell testing med VoiceOver/NVDA
- [ ] Lighthouse accessibility audit

### Tilgjengelighetserklæring
- [x] Opprett /tilgjengelighet-side med erklæring
- [x] Oppdater erklæringen når WCAG-arbeidet er fullført
- [x] Legg til lenke til erklæringen i footer

## Kapittel-innsikter (spesialvisninger)

Filen `src/data/chapterInsights.ts` inneholder strukturerte visninger for spesielle kapitler.
Nåværende: 53 kapitler. Ideer til flere:

### Johannes - Jesu tegn/mirakler
- [x] Joh 2 - Vann til vin (tegn 1)
- [x] Joh 4 - Embetsmannens sønn (tegn 2)
- [x] Joh 5 - Mannen ved Betesda (tegn 3)
- [x] Joh 9 - Den blindfødte (tegn 5)
- [x] Joh 11 - Lasarus oppvekkes (tegn 6)
- [x] Joh 21 - Fiskefangsten (tegn 7)

### GT - Strukturer og lister
- [ ] 2 Mos 25-27 - Tabernakelet (kan samles i kap 25)
- [ ] 2 Mos 28 - Presteklærne
- [ ] 3 Mos 1-7 - De 5 offertypene (kan samles i kap 1)
- [ ] 3 Mos 11 - Rene og urene dyr
- [ ] 4 Mos 33 - Israels 42 leirplasser
- [ ] Neh 3 - Jerusalems 10 porter

### GT - Profetier og syn
- [ ] Esek 37 - De tørre bein
- [ ] Esek 47 - Vannet fra tempelet
- [ ] Sak 14 - Herrens dag

### Salmer
- [x] Sal 1 - De to veier
- [x] Sal 51 - Botssalmen
- [x] Sal 91 - Trygghet hos Gud
- [x] Sal 139 - Gud kjenner meg

### Evangeliene - Påskeuken
- [ ] Matt 21/Mark 11/Luk 19 - Palmesøndag
- [ ] Matt 26/Mark 14/Luk 22 - Skjærtorsdag
- [ ] Matt 27/Mark 15/Luk 23 - Langfredag
- [ ] Matt 28/Mark 16/Luk 24 - Påskedag

### NT - Brev
- [x] Rom 12 - Lev som et offer
- [x] 1 Kor 12 - Nådegavene
- [x] 1 Kor 15 - Oppstandelsen
- [x] Fil 2 - Kristi ydmykhet (Kristus-hymnen)
- [x] Kol 1 - Kristus-hymnen
- [ ] 1 Tess 4 - Herrens gjenkomst
- [x] Heb 1 - Jesus > englene
- [x] Jak 3 - Tungen

### Øvrige
- [ ] Dom 2 eller 3 - Dommersyklusen / oversikt over dommerne
- [ ] 1 Kong 17-19 - Elia-syklusen (kan samles i kap 17)
- [ ] 2 Kong 2, 4 - Elisas mirakler

## Bugs/Forbedringer
- (ingen kjente)
