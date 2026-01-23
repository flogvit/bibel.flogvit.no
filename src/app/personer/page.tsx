import styles from './page.module.scss';
import { getAllPersonsData, eraLabels, roleLabels } from '@/lib/bible';
import { PersonList } from '@/components/PersonList';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Bibelske personer - Bibelen',
  description: 'Oversikt over sentrale personer i Bibelen med biografi, nøkkelhendelser og bibelvers',
};

export default function PersonsPage() {
  const persons = getAllPersonsData();

  // Get unique eras and roles for filtering
  const eras = [...new Set(persons.map(p => p.era))].sort();
  const roles = [...new Set(persons.flatMap(p => p.roles))].sort();

  // Transform for the PersonList component
  const personList = persons.map(person => ({
    ...person,
    eraLabel: eraLabels[person.era] || person.era,
    roleLabels: person.roles.map(r => roleLabels[r] || r),
    searchText: [
      person.name,
      person.title,
      person.summary,
      person.roles.join(' '),
      eraLabels[person.era] || person.era,
    ].join(' '),
  }));

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Personer' }
        ]} />

        <h1>Bibelske personer</h1>
        <p className={styles.intro}>
          Utforsk sentrale skikkelser i Bibelen. Klikk på en person for å lese mer om deres liv,
          nøkkelhendelser og relevante bibelvers.
        </p>

        <PersonList
          persons={personList}
          eras={eras.map(e => ({ id: e, label: eraLabels[e] || e }))}
          roles={roles.map(r => ({ id: r, label: roleLabels[r] || r }))}
        />
      </div>
    </div>
  );
}
