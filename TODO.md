# TODO - Bibel.flogvit.com

## Fase 1: Grunnleggende oppsett ✓
- [x] Initialisere Next.js-prosjekt med TypeScript og SASS
- [x] Sette opp SQLite database med better-sqlite3 (to databaser: bible.db + users.db)
- [x] Lage database-skjema for bibeldata
- [x] Lage importskript for å laste data fra ../free-bible/generate/

## Fase 2: Layout og navigasjon ✓
- [x] Header-komponent (logo, navigasjon, søk?)
- [x] Footer-komponent (lenker, om-side, copyright)
- [x] Mobilmeny (hamburgermeny for navigasjon)
- [x] Forside med bokliste (GT/NT)
- [x] Kapittelside med sidebar
- [x] Forrige/Neste kapittel-navigasjon
- [x] Mobilnavigasjon nederst (MobileToolbar)

## Fase 3: Bibelvisning ✓
- [x] Versvisning med klikkbare ord
- [x] Word4word popup ved klikk på ord
- [x] Referansevisning ved klikk på versnummer
- [x] Støtte for vers-anker: /[bok]/[kapittel]#v5
- [x] Scroll til vers ved navigasjon fra referanse (med highlight-animasjon)

## Fase 4: Hjelpemidler ✓
- [x] Settings-system med localStorage
- [x] ToolsPanel-komponent i sidebar (desktop)
- [x] MobileToolbar med hjelpemidler (mobil)
- [x] Boksammendrag (toggle av/på)
- [x] Kapittelsammendrag (toggle av/på)
- [x] Viktige ord per kapittel (toggle av/på)
- [x] Kjente bibelvers-side (/kjente-vers)
- [x] Favoritter med localStorage (/favoritter)
- [x] Bønn basert på vers (verse_prayer)
- [x] Andakt/preken for vers (verse_sermon)
- [x] Tematiske oversikter (themes)
  - [x] Tema-oversiktside med søk/filter (/temaer)
  - [x] ThemeList-komponent med ranked søk
  - [x] Støtte for nytt JSON-format med seksjoner og vers-referanser
  - [x] ThemeVerseDisplay-komponent for visning av bibelvers i tema
  - [x] API-endepunkt for å hente flere vers (/api/verses)
  - [x] Lenker til vers i kontekst ("Vis i kontekst")

## Fase 5: Grunntekst ✓
- [x] Bestemme visningsformat (under vers / parallell / kun popup)
- [x] Visning av hebraisk tekst (tanach) med RTL-støtte
- [x] Visning av gresk tekst (sblgnt)
- [x] Toggle for grunntekst-visning i Hjelpemidler

## Fase 6: Søk ✓
- [x] Søkeside (/sok)
- [x] Fulltekstsøk i bibelteksten
- [x] Paginering med "last flere"-knapp
- [x] Vise totalt antall resultater
- [x] Søk i originalspråk (klikk-for-å-søke fra ord-popup, /sok/original)
  - [x] Normalisering av hebraisk (fjerner kantillasjonsmerker for matching)
  - [x] Prefiksmatching for hebraisk (בְּרֵאשִׁית matcher רֵאשִׁית)
  - [x] Highlighting av matchende ord i grunnteksten
  - [x] Highlighting av norske ord (krever word4word-data for boken)
- [x] Søkeresultater med kontekst og highlighting
- [x] Søkefelt i header
- [x] Bibelreferanse-parser med autocomplete (f.eks. "mat 4,5" → Matteus 4:5)

## Fase 7: Brukerinnstillinger (uten innlogging) ✓
- [x] LocalStorage for brukerpreferanser
- [x] Skriftstørrelse-innstilling (liten/medium/stor)
- [x] Mørk/lys modus

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
- [x] Emnetagging av vers (localStorage-versjon)
  - [x] Knytte ett eller flere emner til et vers
  - [x] Autocomplete-søk i egne tidligere emner
  - [x] Opprette nye emner ved å skrive inn
  - [x] Emneside (/emner) med oversikt over alle dine emner
  - [x] Klikk på emne → vis alle vers tagget med emnet
  - [x] Redigere/slette emner
  - [x] localStorage-versjon (uten innlogging)
  - [ ] Database-versjon (med innlogging, users.db)

## Fase 10: Produksjon
- [x] Apache reverse proxy-konfigurasjon (deploy/bibel.flogvit.com.conf)
- [x] PM2 deploy-skript (npm run deploy)
- [x] Favicon og metadata
- [x] Open Graph tags for deling
- [x] Sitemap for SEO

## Innholdssider
- [x] Om-side (/om) med kilder og lenker
- [x] Kontaktinfo på Om-siden

## Studiebibel-funksjoner

### AI-generert innhold (Claude API)

Disse kan genereres med `claude-opus-4-5-20251101` og lagres under `../free-bible/generate/`.

#### Kontekst og bakgrunn
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Historisk kontekst per kapittel | `.md` | `chapter_context.mjs` | `chapter_context/nb/` |
| Kulturell bakgrunn og skikker | `.md` | (inkl. i chapter_context) | |
| Arkeologisk bakgrunn | `.md` | (inkl. i chapter_context) | |
| Tidslinje for bibelske hendelser | `.json` | `timeline.mjs` | `timeline/` |

#### Ordstudier
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Ordhistorie og etymologi | `.json` | `word_etymology.mjs` | `word_etymology/` |
| Semantiske felt (relaterte ord) | `.json` | `word_relations.mjs` | `word_relations/` |

#### Teologi og tolkning
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Profetier og oppfyllelser | `.json` | `prophecies.mjs` | `prophecies/` |
| Doktrinær oversikt per tema | `.md` | (inkl. i themes.mjs) | `themes/nb/` |
| Typologi (GT→NT) | `.json` | `typology.mjs` | `typology/` |

#### Personlig bibelstudium
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Spørsmål til refleksjon | `.json` | `reflection_questions.mjs` | `reflection_questions/nb/` |
| Applikasjoner for dagliglivet | `.json` | `applications.mjs` | `applications/nb/` |

#### Oppslagsverk
| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Personprofiler (bibelske karakterer) | `.md` | `bible_persons.mjs` | `persons/nb/` |
| Stedsoversikt med beskrivelser | `.md` | `bible_places.mjs` | `places/nb/` |
| Symboler og billedspråk forklart | `.md` | `symbols.mjs` | `symbols/nb/` |
| Bibelsk ordbok/leksikon | `.md` | `bible_dictionary.mjs` | `dictionary/nb/` |

### Beregnes fra eksisterende data

Disse kan bygges lokalt uten API-kall.

| Funksjon | Kilde | Skript | Output |
|----------|-------|--------|--------|
| Konkordans | word4word + verses | `build_concordance.mjs` | `concordance/` |
| Parallelle tekster (synoptikerne) | Eksterne datasett | `sync_gospels.mjs` | `parallel_texts/` |
| Oversettelsesalternativer | word4word (finnes) | - | - |
| Leseplaner | Egen logikk | `reading_plans.mjs` | `reading_plans/` |

**Leseplaner (egenproduserte, ikke kopiert):**
- Årlig (365 dager) - 1189 kapitler fordelt jevnt, GT+NT hver dag
- Kronologisk - basert på bibelens egen kronologi (konger, profeter, etc.)
- NT på 9 uker - 260 kapitler / 4 per dag
- Salmene (150 dager)
- Ordspråkene (31 dager - én per dag i måneden)
- Evangeliene parallelt (synoptisk lesing)
- Tematiske: Påske, Jul, Faste, etc.

### Eksterne kilder

| Funksjon | Mulige kilder |
|----------|---------------|
| Geografisk info med kart | OpenBible.info (koordinater), Leaflet/OpenStreetMap |
| Lydbibel-integrasjon | Må finne åpen kilde eller lisensiert innhold |
| Bilder og illustrasjoner | Public domain bilder, eller lisensiert |

### Frontend-funksjoner (ikke data-generering)

Disse implementeres i Next.js, ikke som genererte data:

- [ ] Bibelvers-memorering med repetisjon (spaced repetition i frontend)
- [ ] Studienotater (brukerdata i users.db, krever innlogging)
- [ ] Kart for bibelske reiser (Leaflet-komponent med koordinater fra places/)

#### Leseplan-funksjonalitet ✓
- [x] Velg aktiv leseplan (localStorage: `activeReadingPlan`)
- [x] Lagre progresjon (localStorage: `readingPlanProgress`)
- [x] "Dagens lesemål"-boks på forsiden
  - Viser kapittel(er) for i dag
  - Markér som lest-knapp
  - Lenke direkte til kapittelet
- [x] Leseplan-side (/leseplan)
  - Oversikt over tilgjengelige planer
  - Progresjonsoversikt (X% fullført, Y dager igjen)
  - Kalendervisning av hva som er lest
- [x] Streak-teller (antall dager på rad)

## Data-generering (../free-bible/generate/)

### Status per datatype

| Datatype | Status | Filer | Skript |
|----------|--------|-------|--------|
| word4word | ✅ Komplett | 22,285 | `nt_word4word.mjs`, `gt_word4word.mjs` |
| book_summaries | ✅ Komplett | 65 | `book_summary.mjs` |
| chapter_summaries | ✅ Komplett | 1,189 | `chapter_summary.mjs` |
| important_words | ✅ Komplett | 889 | `important_words_chapter.mjs` |
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

```md
# Frelse

## Introduksjon
Frelse er et sentralt tema i Bibelen...

## Nøkkelvers
- Johannes 3:16 - "For så høyt har Gud elsket verden..."
- Efeserne 2:8-9 - "For av nåde er dere frelst..."

## GT-bakgrunn
...

## NT-oppfyllelse
...
```

#### 2. verse_prayer.mjs - Bønn basert på vers
Generere bønner inspirert av bibelvers i JSON-format. Kan starte med de 50 versene i `important_verses/verses.txt`.

**Format:** `verse_prayer/nb/[bok]-[kapittel]-[vers].json`

```json
{
  "bookId": 43,
  "chapter": 3,
  "verse": 16,
  "text": "For så høyt har Gud elsket verden...",
  "prayer": "Kjære Gud, takk for din uendelige kjærlighet..."
}
```

#### 3. verse_sermon.mjs - Andakt/preken basert på vers
Generere korte andakter (300-500 ord) i JSON-format med strukturert innhold.

**Format:** `verse_sermon/nb/[bok]-[kapittel]-[vers].json`

```json
{
  "bookId": 43,
  "chapter": 3,
  "verse": 16,
  "text": "For så høyt har Gud elsket verden...",
  "title": "Guds uendelige kjærlighet",
  "introduction": "...",
  "mainPoints": [
    { "heading": "Kjærlighetens omfang", "content": "..." },
    { "heading": "Kjærlighetens gave", "content": "..." },
    { "heading": "Kjærlighetens formål", "content": "..." }
  ],
  "application": "...",
  "closingPrayer": "..."
}
```

#### 4. important_verses2json.mjs - Konvertere til JSON
Konvertere `important_verses/verses.txt` til strukturerte JSON-filer.

**Format:** `important_verses/verses.json` (én samlet fil)

```json
[
  {
    "bookId": 1,
    "chapter": 1,
    "verse": 1,
    "text": "I begynnelsen skapte Gud himmelen og jorden.",
    "tags": ["skapelsen", "gud", "begynnelsen"]
  }
]
```

### Eksisterende skript som må kjøres videre

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
- [ ] (ingen kjente ennå)
