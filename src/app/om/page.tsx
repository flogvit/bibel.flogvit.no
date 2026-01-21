import styles from './page.module.scss';
import Link from 'next/link';

export const metadata = {
  title: 'Om siden - Bibelen',
  description: 'Informasjon om bibel.flogvit.com og kildene som brukes',
};

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/" className={styles.backLink}>← Tilbake til Bibelen</Link>

        <h1>Om denne siden</h1>

        <section className={styles.section}>
          <h2>Prosjektet</h2>
          <p>
            Denne bibelsiden er en del av et åpent prosjekt for å gjøre Bibelen
            tilgjengelig med gode studieverktøy. All kildekode og data er åpent
            tilgjengelig.
          </p>
          <p>
            <a href="https://github.com/flogvit/free-bible/" target="_blank" rel="noopener noreferrer">
              github.com/flogvit/free-bible
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Bibeloversettelser</h2>

          <h3>Norsk tekst (OSNB1)</h3>
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
            <li><strong>Ord-for-ord</strong> - Forklaring av hvert ord med hebraisk/gresk original</li>
            <li><strong>Referanser</strong> - Kryssreferanser mellom bibelvers</li>
            <li><strong>Boksammendrag</strong> - Oversikt over hver boks innhold</li>
            <li><strong>Kapittelsammendrag</strong> - Kort beskrivelse av hvert kapittel</li>
            <li><strong>Viktige ord</strong> - Nøkkelbegreper forklart</li>
          </ul>
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
    </main>
  );
}
