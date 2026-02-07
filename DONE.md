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
- [x] Apache reverse proxy-konfigurasjon (deploy/bibel.flogvit.no.conf)
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

### Multi-tidslinje (bibel, verden, bøker) ✓
- [x] Tre typer tidslinje: bibel, verden (verdenshistorie), bøker (per bok)
- [x] Database-skjema med timeline_type, timeline_book_sections-tabell
- [x] Import fra timeline/nb/events/, timeline/nb/world/, timeline/nb/books/
- [x] API-endepunkt /api/timeline/multi (bakoverkompatibel /api/timeline beholdt)
- [x] Tre-kolonne layout (verden/bibelen/bok) på desktop, tabs på mobil
- [x] Periodefilter synkronisert på tvers av kolonner
- [x] Bok-velger med seksjoner og hendelser
- [x] Dark mode støtte

### Parallelle evangelietekster ✓
- [x] JSON-data med 74 paralleller i 11 seksjoner (fødsel/barndom, forberedelse, tjeneste, etc.)
- [x] Database-tabeller (gospel_parallel_sections, gospel_parallels, gospel_parallel_passages)
- [x] Import-funksjonalitet i import-bible.ts
- [x] API-endepunkter (/api/parallels, /api/parallels/:id, /api/parallels/:id/verses)
- [x] Parallellside (/paralleller) med seksjonsfilter
- [x] Ekspanderbar visning med lazy-loading av vers
- [x] Fargekoding: Matteus=blå, Markus=grønn, Lukas=oransje, Johannes=lilla
- [x] Desktop: Side-ved-side kolonner for evangeliene
- [x] Mobil: Tabs for å bytte mellom evangelier
- [x] Navigasjonslenke i header og mobil-meny

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
| Tidslinje for bibelske hendelser | `.json` | ✅ Manuelt | `timeline/nb/events/` |
| Verdenshistorisk tidslinje | `.json` | ✅ Manuelt | `timeline/nb/world/` |
| Bok-tidslinjer | `.json` | ✅ Manuelt | `timeline/nb/books/` |
| Profetier og oppfyllelser | `.json` | ✅ Manuelt | `prophecies/` |

## WCAG 2.2 AA Tilgjengelighet ✓

### Oppfattbar (Perceivable)
- [x] Alt-tekst på alle bilder og ikoner
- [x] Beskrivende aria-labels på interaktive elementer
- [x] Semantisk HTML (header, nav, main, article, aside, footer)
- [x] Korrekt overskriftshierarki (h1-h6)
- [x] Landmark-regioner med aria-labels
- [x] Skip-link til hovedinnhold
- [x] Kontrastsjekk alle fargekombinasjoner (minimum 4.5:1 for tekst)
- [x] Tekst kan forstørres 200% uten tap av funksjonalitet
- [x] Støtte for brukerens foretrukne fargevalg (prefers-color-scheme, prefers-contrast)
- [x] Støtte for prefers-reduced-motion
- [x] Ingen informasjon kun formidlet via farge

### Betjenbar (Operable)
- [x] Alle funksjoner tilgjengelig via tastatur
- [x] Synlig fokusindikator på alle interaktive elementer
- [x] Logisk tab-rekkefølge
- [x] Ingen tastaturfeller
- [x] Fokus ikke skjult bak sticky elementer (2.4.11)
- [x] Hurtigtaster implementert (?, piltaster, Alt+Shift+bokstav)
- [x] Konsistente navigasjonsmekanismer (breadcrumbs på alle sider)
- [x] Flere måter å finne innhold (søk, meny, sitemap)
- [x] Beskrivende lenketekster
- [x] Breadcrumbs for orientering
- [x] Fokus-håndtering ved sidenavigasjon (NavigationAnnouncer)
- [x] Target size minimum 24x24px (2.5.8)
- [x] Alternativ til dra-og-slipp operasjoner (2.5.7)

### Forståelig (Understandable)
- [x] Språk definert i HTML (lang="nb")
- [x] Språkendringer markert (hebraisk/gresk tekst med lang-attributt)
- [x] Forkortelser forklart (abbr-tag)
- [x] Konsistent plassering av UI-elementer
- [x] Ingen uventede kontekstendringer ved fokus/input
- [x] Konsistent hjelp tilgjengelig (3.2.6)
- [x] Tydelige feilmeldinger
- [x] Labels for alle skjemafelt
- [x] Instruksjoner der nødvendig
- [x] Redundant Entry (3.3.7)

### Robust
- [x] Validert HTML (build uten feil)
- [x] ARIA brukt korrekt
- [x] Statusmeldinger annonsert til skjermlesere (aria-live)

### Verktøy
- [x] eslint-plugin-jsx-a11y
- [x] axe-core for automatisk testing

### Tilgjengelighetserklæring
- [x] /tilgjengelighet-side med erklæring
- [x] Lenke i footer

## Kapittel-innsikter ✓

Data i `../free-bible/generate/chapter_insights/nb/[bok]-[kapittel].json` (96 kapitler).

### Johannes - Jesu tegn/mirakler
- [x] Joh 2, 4, 5, 9, 11, 21 - Alle 7 tegn

### GT - Strukturer og lister
- [x] 2 Mos 25-28 - Tabernakelet og presteklærne
- [x] 3 Mos 1-7, 11 - Offertyper og rene/urene dyr
- [x] 4 Mos 33 - Israels 42 leirplasser
- [x] Neh 3 - Jerusalems 10 porter

### GT - Profetier og syn
- [x] Esek 37, 47 - De tørre bein, vannet fra tempelet
- [x] Sak 14 - Herrens dag

### Salmer
- [x] Sal 1, 22, 51, 91, 119, 139

### Evangeliene - Påskeuken
- [x] Matt 21/Mark 11/Luk 19 - Palmesøndag
- [x] Matt 26/Mark 14/Luk 22 - Skjærtorsdag
- [x] Matt 27/Mark 15/Luk 23 - Langfredag
- [x] Matt 28/Mark 16/Luk 24 - Påskedag

### NT - Brev
- [x] Rom 8, 12 - Intet kan skille oss, Lev som et offer
- [x] 1 Kor 12, 13, 15 - Nådegavene, Kjærligheten, Oppstandelsen
- [x] Gal 5 - Åndens frukt
- [x] Ef 6 - Guds fulle rustning
- [x] Fil 2, 4 - Kristus-hymnen, Gleden i Herren
- [x] Kol 1 - Kristus-hymnen
- [x] 1 Tess 4 - Herrens gjenkomst
- [x] Heb 1, 11 - Jesus > englene, Troens helter
- [x] Jak 3 - Tungen
- [x] 1 Pet 2 - Levende steiner

### GT - Skapelse og patriarkene
- [x] 1 Mos 1, 3, 12, 22, 49 - Skapelsen, Syndefallet, Abraham, Isak, Jakobs velsignelser
- [x] 2 Mos 12, 14 - Påsken, Sivsjø-underet
- [x] 5 Mos 28 - Velsignelser og forbannelser

### GT - Profetene
- [x] Jes 6, 9, 40, 53 - Jesajas kall, Fredsfyrsten, Trøst, Den lidende tjener
- [x] Jer 31 - Den nye pakt
- [x] Dan 2, 7 - Nebukadnesars drøm, De fire dyrene
- [x] Joel 2 - Åndens utøsning
- [x] Jona 2 - Jonas bønn fra fisken

### GT - Visdomslitteratur
- [x] Job 38 - Guds tale til Job
- [x] Ordsp 31 - Den gode hustru

### Evangeliene (flere)
- [x] Matt 5, 6, 13, 24 - Saligprisningene, Fader vår, Lignelser, Endetidstalen
- [x] Luk 2, 10, 15 - Juleevangeliet, Samaritan, De tre lignelsene
- [x] Joh 1, 3, 10, 15, 17 - Prologen, Nikodemus, Hyrden, Vintreet, Yppersteprestlig bønn
- [x] Apg 2 - Pinsen

### Åpenbaringen
- [x] Åp 2-5, 12, 21 - Menighetene, Tronerommet, Kvinnen og dragen, Det nye Jerusalem

### Øvrige
- [x] Dom 2-3 - Dommersyklusen
- [x] 1 Kong 17-19 - Elia-syklusen
- [x] 2 Kong 2, 4 - Elisas mirakler

## Fase 7: Migrering til Vite + React SPA ✓

- [x] Opprett ny Vite + React + TypeScript konfigurasjon
- [x] Konfigurer Vite for SCSS modules
- [x] Konfigurer path aliases (@/)
- [x] Sett opp React Router
- [x] Migrer alle komponenter, hooks, lib, styles
- [x] Opprett route-komponenter i pages/
- [x] Sett opp App.tsx med React Router routes
- [x] Express API-server med alle routes
- [x] SQLite-tilkobling
- [x] Service worker og offline-støtte
- [x] Fjern Next.js avhengigheter

## IndexedDB og brukerdata ✓

- [x] IndexedDB oppsett (idb-keyval)
- [x] Migrere fra localStorage til IndexedDB
- [x] Universell tagging - tagge alle typer innhold (vers, notater, profetier, tidslinje, personer, leseplaner, temaer)
- [x] Eksport/import av all brukerdata fra IndexedDB (v2-format)
- [x] Bakoverkompatibel import av v1-format

## Notater ✓

- [x] Notat-funksjonalitet i versdetaljer
- [x] Notatside (/notater) med oversikt
- [x] Emnetagging av notater
- [x] Redigering og sletting av notater
- [x] Eksport/import av notater

## Bibelske personer ✓

- [x] Personside (/personer) med oversikt
- [x] Enkeltpersonside (/personer/:id) med biografi og referanser
- [x] API-endepunkter (/api/persons, /api/persons/:id)
- [x] Navigasjonslenke i header

## Statistikk ✓

- [x] Statistikkside (/statistikk) med leseoversikt
- [x] Navigasjonslenke i header

## Bruker-oversettelser ✓

- [x] Oversettelsesside (/oversettelser) for opplasting av egne bibeloversettelser
- [x] Lagring i IndexedDB
- [x] Integrert i bibelvelger i header
- [x] Eksport/import av bruker-bibler (v2-format)

## Verslister ✓

- [x] Versliste-side (/lister) med to-panel layout
- [x] Opprett, rediger, slett navngitte verslister
- [x] Referanseinput med norsk format (Joh 3,16) via /api/reference
- [x] Visning av vers med full tekst (VerseDisplay)
- [x] Endre rekkefølge (flytt opp/ned)
- [x] Kopier lenke til /tekst-visning
- [x] Lagring i IndexedDB med localStorage-fallback
- [x] Eksport/import med merge-støtte (v2-format)
- [x] Navigasjonslenke i header (Ressurser-meny)
- [x] Dark mode støtte

## Hurtigtaster oppdatert ✓

- [x] Alt+Shift+V → Verslister
- [x] Alt+Shift+A → Paralleller
- [x] Alt+Shift+I → Statistikk
- [x] Oppdatert hurtigtasthjelp-modal (?-tasten)
- [x] Oppdatert Om-side med alle funksjoner og hurtigtaster
