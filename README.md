# bibel.flogvit.no

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

## Miljøvariabler

Synkroniseringsserveren krever følgende miljøvariabler:

| Variabel | Beskrivelse | Standard |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (server) | *(påkrevd)* |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (klient, samme verdi) | *(påkrevd)* |
| `JWT_SECRET` | Hemmelighet for signering av JWT-tokens | `dev-secret-change-in-production` |
| `MYSQL_HOST` | MySQL-serveradresse | `localhost` |
| `MYSQL_PORT` | MySQL-port | `3312` |
| `MYSQL_USER` | MySQL-brukernavn | `bible` |
| `MYSQL_PASSWORD` | MySQL-passord | `test` |
| `MYSQL_DATABASE` | MySQL-databasenavn | `bible` |
| `PORT` | Express-serverport | `3018` |

### Oppsett av synkronisering

1. Opprett et Google Cloud-prosjekt med OAuth 2.0-credentials
2. Sett opp en MySQL-database (port 3312)
3. Kjør `npm run init-mysql` for å opprette tabeller
4. Sett miljøvariablene (f.eks. i `.env`)

## Bidra

Feil og forslag rapporteres via [GitHub Issues](https://github.com/flogvit/bibel.flogvit.no/issues).

For å kjøre prosjektet lokalt trenger du bibeldata fra [free-bible](https://github.com/flogvit/free-bible/) i `../free-bible/generate/`.

**Viktig:** Ikke legg ved kopibeskyttet materiale i pull requests eller issues. Bibeltekster og oversettelser kan ha opphavsrettslige begrensninger. Kun materiale som er i det fri (public domain) eller har en åpen lisens kan inkluderes i prosjektet.

## Lisens

[MIT](LICENSE)
