import styles from './page.module.scss';
import { getFullProphecyData } from '@/lib/bible';
import { ProphecyView } from '@/components/ProphecyView';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Profetier og oppfyllelser - Bibelen',
  description: 'Oversikt over profetier i Det gamle testamente og deres oppfyllelse i Det nye testamente',
};

export default function PropheciesPage() {
  const prophecyData = getFullProphecyData();

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Profetier' }
        ]} />

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
    </div>
  );
}
