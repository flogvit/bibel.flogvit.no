import styles from '../om/page.module.scss';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Tilgjengelighetserklæring - Bibelen',
  description: 'Tilgjengelighetserklæring for bibel.flogvit.no',
};

export default function AccessibilityPage() {
  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Tilgjengelighet' }
        ]} />

        <h1>Tilgjengelighetserklæring</h1>

        <section className={styles.section}>
          <h2>Om tilgjengelighet på denne siden</h2>
          <p>
            bibel.flogvit.no er utviklet for å være tilgjengelig for alle,
            uavhengig av funksjonsevne. Siden oppfyller kravene i WCAG 2.2 på
            nivå AA.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Status</h2>
          <p>
            <strong>Samsvarsstatus:</strong> Delvis i samsvar med WCAG 2.2 AA
          </p>
          <p>
            Siden er testet og utviklet med tanke på tilgjengelighet. Manuell testing
            med skjermlesere gjenstår.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Kjente begrensninger</h2>
          <p>
            Vi er klar over følgende områder som kan ha tilgjengelighetsproblemer:
          </p>
          <ul>
            <li>Ikke alle funksjoner er testet med skjermlesere (VoiceOver/NVDA)</li>
          </ul>
          <p>
            Vi jobber aktivt med å teste og utbedre eventuelle problemer.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Hva gjør vi?</h2>
          <h3>Struktur og semantikk</h3>
          <ul>
            <li>Semantisk og strukturert HTML med korrekte landmark-regioner</li>
            <li>Skip-link for å hoppe direkte til hovedinnhold</li>
            <li>Korrekt overskriftshierarki (h1-h6)</li>
            <li>Breadcrumbs på alle sider for orientering</li>
            <li>Språkmerking på hebraisk og gresk tekst (lang-attributt)</li>
            <li>Forkortelser forklart med abbr-tag</li>
            <li>ARIA-labels på alle interaktive elementer</li>
            <li>aria-live regioner for statusmeldinger</li>
          </ul>

          <h3>Visuell tilgjengelighet</h3>
          <ul>
            <li>Fargekontrast som oppfyller WCAG AA-krav (4.5:1)</li>
            <li>Informasjon formidles aldri kun via farge (ikoner/symboler i tillegg)</li>
            <li>Tydelig fokusindikator på alle klikkbare elementer</li>
            <li>Tilpassbar tekststørrelse (liten/medium/stor)</li>
            <li>Mørk modus for redusert lysbelastning</li>
            <li>Støtte for høykontrastmodus (prefers-contrast)</li>
            <li>Støtte for redusert bevegelse (prefers-reduced-motion)</li>
            <li>Minimum klikkbar størrelse 24x24px (WCAG 2.5.8)</li>
          </ul>

          <h3>Navigasjon</h3>
          <ul>
            <li>Konsistent plassering av navigasjon, header og footer</li>
            <li>Flere måter å finne innhold (søk, meny, breadcrumbs, sitemap)</li>
            <li>Beskrivende lenketekster og aria-labels</li>
            <li>Ingen uventede kontekstendringer ved fokus eller input</li>
            <li>Konsistent hjelp tilgjengelig via Footer (WCAG 3.2.6)</li>
          </ul>

          <h3>Tastaturnavigasjon</h3>
          <ul>
            <li>Alle funksjoner tilgjengelige via tastatur</li>
            <li>Fokus skjules ikke bak sticky elementer (WCAG 2.4.11)</li>
            <li>Logisk tab-rekkefølge</li>
            <li>Ingen tastaturfeller</li>
          </ul>

          <h3>Hurtigtaster</h3>
          <p>Trykk <kbd>?</kbd> for å se alle tilgjengelige hurtigtaster.</p>
          <ul>
            <li><kbd>?</kbd> - Vis/skjul hurtigtasthjelp</li>
            <li><kbd>/</kbd> eller <kbd>Ctrl</kbd>+<kbd>K</kbd> - Gå til søkefeltet</li>
            <li><kbd>←</kbd> / <kbd>→</kbd> - Forrige/neste kapittel</li>
            <li><kbd>1-9</kbd> - Hopp til vers 1-9</li>
            <li><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd> - Gå til forsiden</li>
          </ul>

          <h3>Skjemaer og feilhåndtering</h3>
          <ul>
            <li>Tydelige labels og instruksjoner på alle skjemafelt</li>
            <li>Beskrivende feilmeldinger på norsk</li>
            <li>Placeholder-tekster som veileder brukeren</li>
          </ul>

          <h3>Testing og kvalitetssikring</h3>
          <ul>
            <li>Automatisk tilgjengelighetstesting med eslint-plugin-jsx-a11y</li>
            <li>Automatisk testing med axe-core</li>
            <li>Validert HTML (Next.js build)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Tilbakemelding</h2>
          <p>
            Opplever du problemer med tilgjengeligheten på siden? Vi setter pris på
            tilbakemeldinger slik at vi kan forbedre oss.
          </p>
          <p>
            <strong>Kontakt:</strong>
          </p>
          <p>
            E-post: <a href="mailto:Vegard.Hanssen@menneske.no">Vegard.Hanssen@menneske.no</a>
          </p>
          <p>
            Du kan også melde inn problemer på GitHub:{' '}
            <a href="https://github.com/flogvit/free-bible/issues" target="_blank" rel="noopener noreferrer">
              github.com/flogvit/free-bible/issues
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>Tilsynsmyndighet</h2>
          <p>
            Digitaliseringsdirektoratet (Digdir) er tilsynsmyndighet for universell
            utforming av IKT i Norge. Hvis du mener at vi ikke har svart tilfredsstillende
            på din henvendelse, kan du kontakte Digdir.
          </p>
          <p>
            <a href="https://uutilsynet.no/" target="_blank" rel="noopener noreferrer">
              uutilsynet.no
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <p>
            <em>Sist oppdatert: Januar 2026</em>
          </p>
        </section>
      </div>
    </div>
  );
}
