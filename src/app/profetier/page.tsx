import styles from './page.module.scss';
import Link from 'next/link';
import { getFullProphecyData } from '@/lib/bible';
import { ProphecyView } from '@/components/ProphecyView';

export const metadata = {
  title: 'Profetier og oppfyllelser - Bibelen',
  description: 'Oversikt over profetier i Det gamle testamente og deres oppfyllelse i Det nye testamente',
};

export default function PropheciesPage() {
  const prophecyData = getFullProphecyData();

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/" className={styles.backLink}>← Tilbake til Bibelen</Link>

        <h1>Profetier og oppfyllelser</h1>
        <p className={styles.intro}>
          En oversikt over profetier i Det gamle testamente og hvordan de ble oppfylt
          i Det nye testamente. Klikk på en profeti for å se forklaringen og bibelversene.
        </p>

        <ProphecyView
          categories={prophecyData.categories}
          prophecies={prophecyData.prophecies}
        />
      </div>
    </main>
  );
}
