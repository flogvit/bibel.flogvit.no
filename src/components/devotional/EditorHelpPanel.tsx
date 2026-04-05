import styles from './EditorHelpPanel.module.scss';

export function EditorHelpPanel() {
  return (
    <div className={styles.panel}>
      <h3 className={styles.sectionTitle}>Referanser</h3>
      <p className={styles.description}>
        Sett inn referanser med <code className={styles.code}>[type:verdi]</code>-syntaks.
        Bruk <code className={styles.code}>|</code> for egendefinert visningstekst.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Syntaks</th>
            <th>Beskrivelse</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code className={styles.code}>[ref:Joh 3,16]</code></td>
            <td>Versreferanse (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[ref:Joh 3,16|Min tekst]</code></td>
            <td>Med egendefinert visningstekst</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[ref:Joh 3,16@osnb2]</code></td>
            <td>Med bibelversjon-override</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[ref:Joh 3,16@sblgnt]</code></td>
            <td>Vis gresk grunntekst</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[vers:joh-3-16]</code></td>
            <td>Legacy-format (bok-kapittel-vers)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[manuskript:slug]</code></td>
            <td>Manuskript (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[andakt:slug]</code></td>
            <td>Alias for manuskript</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[manuskript:slug|Min tittel]</code></td>
            <td>Med egendefinert visningstekst</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[tema:Kjærlighet]</code></td>
            <td>Tema (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[person:Abraham]</code></td>
            <td>Person (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[profeti:1]</code></td>
            <td>Profeti (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[parallell:slug]</code></td>
            <td>Parallell-tekst (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[historie:slug]</code></td>
            <td>Historie (klikkbar, kan utvides)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[tema:Kjærlighet|Guds kjærlighet]</code></td>
            <td>Med egendefinert visningstekst</td>
          </tr>
        </tbody>
      </table>

      <h4 className={styles.subTitle}>Referanseformat</h4>
      <p className={styles.description}>
        Referanser bruker norsk format: <code className={styles.code}>Bok kapittel,vers</code>.
        Flere vers: <code className={styles.code}>Joh 3,16-18</code>.
        Flere kapitler: <code className={styles.code}>Sal 23; Sal 91</code>.
      </p>

      <h4 className={styles.subTitle}>Bibelversjoner</h4>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td><code className={styles.code}>osnb2</code></td>
            <td>Norsk bokmål (standard)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>osnn1</code></td>
            <td>Norsk nynorsk</td>
          </tr>
          <tr>
            <td><code className={styles.code}>sblgnt</code></td>
            <td>Gresk NT (SBL)</td>
          </tr>
          <tr>
            <td><code className={styles.code}>tanach</code></td>
            <td>Hebraisk GT</td>
          </tr>
        </tbody>
      </table>

      <h3 className={styles.sectionTitle}>Markdown-formatering</h3>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Syntaks</th>
            <th>Resultat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code className={styles.code}>**fet tekst**</code></td>
            <td><strong>fet tekst</strong></td>
          </tr>
          <tr>
            <td><code className={styles.code}>*kursiv tekst*</code></td>
            <td><em>kursiv tekst</em></td>
          </tr>
          <tr>
            <td><code className={styles.code}>~~gjennomstreking~~</code></td>
            <td><s>gjennomstreking</s></td>
          </tr>
          <tr>
            <td><code className={styles.code}># Overskrift</code></td>
            <td>Stor overskrift</td>
          </tr>
          <tr>
            <td><code className={styles.code}>## Underoverskrift</code></td>
            <td>Underoverskrift</td>
          </tr>
          <tr>
            <td><code className={styles.code}>- Punkt</code></td>
            <td>Punktliste</td>
          </tr>
          <tr>
            <td><code className={styles.code}>1. Punkt</code></td>
            <td>Nummerert liste</td>
          </tr>
          <tr>
            <td><code className={styles.code}>&gt; Sitat</code></td>
            <td>Sitatblokk</td>
          </tr>
          <tr>
            <td><code className={styles.code}>[tekst](url)</code></td>
            <td>Lenke</td>
          </tr>
          <tr>
            <td><code className={styles.code}>![alt](url)</code></td>
            <td>Bilde</td>
          </tr>
          <tr>
            <td><code className={styles.code}>---</code></td>
            <td>Horisontal linje</td>
          </tr>
        </tbody>
      </table>

      <h4 className={styles.subTitle}>Tabeller</h4>
      <pre className={styles.pre}>{`| Kolonne 1 | Kolonne 2 |
|-----------|-----------|
| Celle 1   | Celle 2   |`}</pre>

      <h3 className={styles.sectionTitle}>Versjoner</h3>
      <p className={styles.description}>
        Du kan låse innholdet som en navngitt versjon via «Lås versjon»-knappen i
        verktøylinjen. Låste versjoner kan ikke endres, men du kan fortsette å
        redigere utkastet.
      </p>
    </div>
  );
}
