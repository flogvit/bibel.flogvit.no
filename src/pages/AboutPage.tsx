import styles from '@/styles/pages/about.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function AboutPage() {
  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Om' }
        ]} />

        <h1>Om denne siden</h1>

        <section className={styles.section}>
          <h2>Prosjektet</h2>
          <p>
            Denne bibelsiden er en del av et åpent prosjekt for å gjøre Bibelen
            tilgjengelig med gode studieverktøy. Både nettsiden og alle bibeldata
            er åpen kildekode og fritt tilgjengelig.
          </p>
          <p>
            <a href="https://github.com/flogvit/bibel.flogvit.no" target="_blank" rel="noopener noreferrer">
              github.com/flogvit/bibel.flogvit.no
            </a>
            {' '}&ndash; kildekoden til denne nettsiden
          </p>
          <p>
            <a href="https://github.com/flogvit/free-bible/" target="_blank" rel="noopener noreferrer">
              github.com/flogvit/free-bible
            </a>
            {' '}&ndash; bibeldata (tekst, grunntekst, referanser, m.m.)
          </p>
        </section>

        <section className={styles.section}>
          <h2>Bibeloversettelser</h2>

          <h3>Norsk tekst (OSNB2)</h3>
          <p>
            Den norske teksten er en åpen oversettelse som er fritt tilgjengelig
            for alle å bruke.
          </p>

          <h3>Hebraisk grunntekst (Tanach)</h3>
          <p>
            Den hebraiske teksten for Det gamle testamente er basert på den
            åpne Tanach-teksten fra Tanach.us.
          </p>
          <p>
            <a href="https://tanach.us" target="_blank" rel="noopener noreferrer">
              Tanach.us
            </a>
          </p>

          <h3>Gresk grunntekst (SBLGNT)</h3>
          <p>
            Den greske teksten for Det nye testamente er SBL Greek New Testament,
            utgitt av Society of Biblical Literature og Logos Bible Software.
          </p>
          <p>
            <a href="https://sblgnt.com/" target="_blank" rel="noopener noreferrer">
              sblgnt.com
            </a>
          </p>
          <p>
            <a href="https://github.com/morphgnt/sblgnt" target="_blank" rel="noopener noreferrer">
              SBLGNT på GitHub
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Hjelpemidler</h2>
          <ul>
            <li><strong>Grunntekst</strong> - Vis hebraisk/gresk originaltekst med ord-for-ord oversettelse</li>
            <li><strong>Referanser</strong> - Kryssreferanser mellom bibelvers</li>
            <li><strong>Boksammendrag</strong> - Oversikt over hver boks innhold</li>
            <li><strong>Kapittelsammendrag</strong> - Kort beskrivelse av hvert kapittel</li>
            <li><strong>Viktige ord</strong> - Nøkkelbegreper forklart</li>
            <li><strong>Tidslinje</strong> - Bibelske hendelser i kronologisk rekkefølge</li>
            <li><strong>Profetier</strong> - Profetier og deres oppfyllelser</li>
            <li><strong>Temaer</strong> - Tematiske oversikter med relevante bibelvers</li>
            <li><strong>Leseplaner</strong> - Ulike planer for systematisk bibellesing</li>
            <li><strong>Favoritter</strong> - Lagre dine favorittvers</li>
            <li><strong>Emner</strong> - Tag vers med egne emner</li>
            <li><strong>Notater</strong> - Skriv egne notater til vers</li>
          </ul>
        </section>

        <section id="hjelp" className={styles.section}>
          <h2>Hjelp og brukerveiledning</h2>
          <p>
            Her er noen tips for å få mest mulig ut av siden:
          </p>

          <h3>Navigasjon</h3>
          <ul>
            <li>Bruk <strong>søkefeltet</strong> øverst for å søke etter vers eller tekst</li>
            <li>Skriv en referanse som <em>&quot;Joh 3:16&quot;</em> for å gå direkte til verset</li>
            <li>Bruk <strong>piltastene</strong> (← →) for å bla mellom kapitler</li>
          </ul>

          <h3>Tastaturhurtigtaster</h3>
          <p>Trykk <kbd>?</kbd> på en hvilken som helst side for å se alle tilgjengelige hurtigtaster.</p>
          <ul>
            <li><kbd>/</kbd> eller <kbd>Ctrl</kbd>+<kbd>K</kbd> - Fokuser søkefeltet</li>
            <li><kbd>←</kbd> / <kbd>→</kbd> - Forrige/neste kapittel</li>
            <li><kbd>1-9</kbd> - Hopp til vers 1-9</li>
            <li><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd> - Gå til forsiden</li>
          </ul>

          <h3>Versinteraksjon</h3>
          <p>Klikk på <strong>versnummeret</strong> for å åpne versdetaljer med følgende faner:</p>
          <ul>
            <li><strong>Grunntekst</strong> - Hebraisk/gresk originaltekst (klikk på ord for oversettelse)</li>
            <li><strong>Referanser</strong> - Kryssreferanser til andre bibelvers</li>
            <li><strong>Profetier</strong> - Profetier knyttet til verset (hvis relevant)</li>
            <li><strong>Emner</strong> - Tag verset med egne emner</li>
            <li><strong>Notater</strong> - Skriv egne notater til verset</li>
            <li><strong>Versjoner</strong> - Sammenlign med andre bibeloversettelser</li>
          </ul>

          <h3>Hjelpemidler-panelet</h3>
          <p>
            På mobil, trykk på tannhjulet (⚙) for å åpne hjelpemidler.
            På desktop vises disse i et sidepanel.
          </p>
        </section>

        <section id="offline" className={styles.section}>
          <h2>Offline-tilgang</h2>
          <p>
            Denne siden fungerer også uten internett. Kapitler du har lest
            blir automatisk lagret på enheten din, slik at du kan lese dem
            igjen selv om du er offline.
          </p>

          <h3>Automatisk lagring</h3>
          <p>
            Når du leser et kapittel, lagres det automatisk i nettleserens cache.
            Neste gang du besøker det samme kapittelet uten nett, vises den lagrede versjonen.
          </p>

          <h3>Last ned hele Bibelen</h3>
          <p>
            Du kan også laste ned hele bibelversjoner på forhånd. Gå til{' '}
            <a href="/offline">offline-siden</a> for å:
          </p>
          <ul>
            <li>Se hvilke kapitler som er lagret</li>
            <li>Laste ned hele bibelversjoner (bokmål, nynorsk, gresk, hebraisk)</li>
            <li>Se hvor mye lagringsplass som brukes</li>
            <li>Slette lagrede data</li>
          </ul>

          <h3>Oppdateringer</h3>
          <p>
            Når bibeldataene oppdateres på serveren, får du en melding om å
            oppdatere de lagrede kapitlene. Du kan velge å oppdatere med en gang
            eller vente til senere.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Kontakt</h2>
          <p>
            Vegard Hanssen
          </p>
          <p>
            E-post: <a href="mailto:Vegard.Hanssen@menneske.no">Vegard.Hanssen@menneske.no</a>
          </p>
          <p>
            Tlf: <a href="tel:+4740401214">+47 404 01 214</a>
          </p>
          <p className={styles.githubLink}>
            Feil og forslag kan også meldes inn på GitHub:{' '}
            <a href="https://github.com/flogvit/free-bible/issues" target="_blank" rel="noopener noreferrer">
              github.com/flogvit/free-bible/issues
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
