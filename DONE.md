# DONE - Bibel.flogvit.com

Fullførte oppgaver flyttet fra TODO.md.

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
- [x] Eksport/import av brukerdata
  - Eksporterer innstillinger, favoritter, emner, leseplan-progresjon
  - Nedlasting som JSON-fil (bibel-data-YYYY-MM-DD.json)
  - Import med valg: erstatt alt eller slå sammen med eksisterende

## Fase 10: Produksjon ✓
- [x] Apache reverse proxy-konfigurasjon (deploy/bibel.flogvit.com.conf)
- [x] PM2 deploy-skript (npm run deploy)
- [x] Favicon og metadata
- [x] Open Graph tags for deling
- [x] Sitemap for SEO

## Innholdssider ✓
- [x] Om-side (/om) med kilder og lenker
- [x] Kontaktinfo på Om-siden

## Studiebibel-funksjoner

### Profetier og oppfyllelser ✓
- [x] JSON-data med 47 profetier i 7 kategorier
- [x] Messianske profetier (fødsel, tjeneste, lidelse, oppstandelse)
- [x] Profetier om Israel, nasjonene og endetiden
- [x] Database-tabeller og import
- [x] API-endepunkt (/api/prophecies)
- [x] Profeti-side (/profetier) med oversikt

### Tidslinje ✓
- [x] JSON-data med 103 bibelske hendelser i 11 perioder
- [x] Database-tabeller (timeline_periods, timeline_events, timeline_references)
- [x] Import-funksjonalitet i import-bible.ts
- [x] API-endepunkt (/api/timeline)
- [x] Tidslinjeside (/tidslinje) med interaktiv visning
- [x] Periodfilter og ekspanderbare hendelser
- [x] Bibelreferanser med lenker til vers

### Tidslinje-forbedringer ✓
- [x] Utvide referanseformat til vers-intervaller (f.eks. 1. Mos 4:1-16 i stedet for bare 4:8)
- [x] Oppdatere JSON-data med fullstendige tekstpassasjer for hver hendelse
- [x] Inline bibelvers i tidslinjen (som i tema-visningen)
- [x] URL-støtte for å vise flere passasjer samtidig (/tekst?refs=1mo-4-1-16,1mo-3-1-24)
- [x] Tidslinje i sidebar ved bibellesing (toggle i Hjelpemidler)
  - Vise relevante hendelser for kapitlet man leser
  - "Du er her"-markør på tidslinjen
- [x] Tidslinje-sidebar på høyre side (3-kolonne layout)
  - Full tidslinje med auto-scroll til relevant kapittel
  - Fallback til nærmeste hendelse når kapitlet ikke har hendelser
  - Respekterer showTimeline toggle i innstillinger

### Leseplan-funksjonalitet ✓
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

### Emnetagging av vers (localStorage-versjon) ✓
- [x] Knytte ett eller flere emner til et vers
- [x] Autocomplete-søk i egne tidligere emner
- [x] Opprette nye emner ved å skrive inn
- [x] Emneside (/emner) med oversikt over alle dine emner
- [x] Klikk på emne → vis alle vers tagget med emnet
- [x] Redigere/slette emner
- [x] localStorage-versjon (uten innlogging)

## Data-generering (fullført)

| Datatype | Status | Filer | Skript |
|----------|--------|-------|--------|
| word4word | ✅ Komplett | 22,285 | `nt_word4word.mjs`, `gt_word4word.mjs` |
| book_summaries | ✅ Komplett | 65 | `book_summary.mjs` |
| chapter_summaries | ✅ Komplett | 1,189 | `chapter_summary.mjs` |
| important_words | ✅ Komplett | 889 | `important_words_chapter.mjs` |

## AI-generert innhold (ferdig)

| Funksjon | Format | Skript | Mappe |
|----------|--------|--------|-------|
| Kapittelkontekst (historisk, kulturell, arkeologisk, geografisk) | `.md` | `chapter_context.mjs` ✅ | `chapter_context/nb/` |
| Tidslinje for bibelske hendelser | `.json` | ✅ Manuelt | `timeline/` |
| Profetier og oppfyllelser | `.json` | ✅ Manuelt | `prophecies/` |
