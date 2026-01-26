import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PersonList } from '@/components/PersonList';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import styles from '@/styles/pages/persons.module.scss';

// Label maps for era and roles
const eraLabels: Record<string, string> = {
  patriarchs: 'Patriarkene',
  exodus: 'Utferden fra Egypt',
  judges: 'Dommertiden',
  united_kingdom: 'Det forente kongedømmet',
  divided_kingdom: 'Det delte kongedømmet',
  exile: 'Eksilet',
  return: 'Tilbakekomsten',
  intertestamental: 'Mellomtestamentlig tid',
  new_testament: 'Det nye testamente',
  early_church: 'Den tidlige kirke',
};

const roleLabels: Record<string, string> = {
  patriarch: 'Patriark',
  prophet: 'Profet',
  king: 'Konge',
  queen: 'Dronning',
  judge: 'Dommer',
  priest: 'Prest',
  apostle: 'Apostel',
  disciple: 'Disippel',
  missionary: 'Misjonær',
  deacon: 'Diakon',
  leader: 'Leder',
  military_leader: 'Hærfører',
  wife: 'Hustru',
  mother: 'Mor',
  hero: 'Helt',
  villain: 'Skurk',
  convert: 'Konvertitt',
};

interface Person {
  id: string;
  name: string;
  title: string;
  era: string;
  summary: string;
  roles: string[];
  eraLabel: string;
  roleLabels: string[];
  searchText: string;
}

export function PersonsContent() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function fetchPersons() {
      try {
        const response = await fetch('/api/persons');

        if (!response.ok) {
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.offline) {
              setIsOffline(true);
              setError('Personer er ikke tilgjengelig offline');
              return;
            }
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Check if response came from IndexedDB
        const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
        if (fromIndexedDB) {
          setIsOffline(true);
        }

        // Transform for the PersonList component
        const personList = (data.persons || data || []).map((person: Person) => ({
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

        setPersons(personList);
      } catch (err) {
        console.error('Failed to fetch persons:', err);
        setError('Kunne ikke laste personer');
        setIsOffline(!navigator.onLine);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPersons();
  }, []);

  // Get unique eras and roles for filtering
  const eras = [...new Set(persons.map(p => p.era))].sort();
  const roles = [...new Set(persons.flatMap(p => p.roles))].sort();

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Personer' }
          ]} />
          <h1>Bibelske personer</h1>
          <p>Laster personer...</p>
        </div>
      </div>
    );
  }

  if (error && persons.length === 0) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Personer' }
          ]} />
          <h1>Bibelske personer</h1>
          <p className={styles.error}>{error}</p>
          {isOffline && (
            <p>
              Du er offline. <Link to="/offline">Se hva som er tilgjengelig offline</Link>.
            </p>
          )}
        </div>
      </div>
    );
  }

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
          persons={persons}
          eras={eras.map(e => ({ id: e, label: eraLabels[e] || e }))}
          roles={roles.map(r => ({ id: r, label: roleLabels[r] || r }))}
        />
      </div>
    </div>
  );
}
