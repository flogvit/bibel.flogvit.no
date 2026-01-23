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

## Bugs/Forbedringer
- (ingen kjente)
