import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PersonVerseDisplay } from '@/components/PersonVerseDisplay';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ItemTagging } from '@/components/ItemTagging';
import styles from '@/styles/pages/person.module.scss';

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

interface PersonKeyEvent {
  title: string;
  description: string;
  verses: {
    bookId: number;
    chapter: number;
    verse?: number;
    verses?: number[];
  }[];
}

interface PersonFamily {
  father?: string;
  mother?: string;
  spouse?: string;
  siblings?: string[];
  children?: string[];
}

interface PersonData {
  id: string;
  name: string;
  title: string;
  era: string;
  lifespan?: string;
  summary: string;
  roles: string[];
  family?: PersonFamily;
  relatedPersons?: string[];
  keyEvents: PersonKeyEvent[];
}

interface RelatedPerson {
  id: string;
  name: string;
  title: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
}

interface PersonContentProps {
  personId: string;
}

export function PersonContent({ personId }: PersonContentProps) {
  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [relatedPersons, setRelatedPersons] = useState<RelatedPerson[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    async function fetchPerson() {
      try {
        const response = await fetch(`/api/persons/${encodeURIComponent(personId)}`);

        if (!response.ok) {
          if (response.status === 404) {
            setNotFoundError(true);
            return;
          }
          if (response.status === 503) {
            const errorData = await response.json();
            if (errorData.offline) {
              setIsOffline(true);
              setError('Personen er ikke tilgjengelig offline');
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

        setPersonData(data);

        // Fetch related persons and family members
        await fetchRelatedData(data);
      } catch (err) {
        console.error('Failed to fetch person:', err);
        setError('Kunne ikke laste personen');
        setIsOffline(!navigator.onLine);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchRelatedData(person: PersonData) {
      const related: RelatedPerson[] = [];
      const family: FamilyMember[] = [];

      // Fetch related persons
      if (person.relatedPersons) {
        for (const id of person.relatedPersons) {
          try {
            const res = await fetch(`/api/persons/${encodeURIComponent(id)}`);
            if (res.ok) {
              const relatedPerson = await res.json();
              related.push({ id, name: relatedPerson.name, title: relatedPerson.title });
            }
          } catch {
            // Skip if we can't fetch
          }
        }
      }

      // Fetch family members
      if (person.family) {
        const addFamilyMember = async (id: string | null | undefined, relation: string) => {
          if (!id) return;
          try {
            const res = await fetch(`/api/persons/${encodeURIComponent(id)}`);
            if (res.ok) {
              const member = await res.json();
              family.push({ id, name: member.name, relation });
            }
          } catch {
            // Skip if we can't fetch
          }
        };

        await addFamilyMember(person.family.father, 'Far');
        await addFamilyMember(person.family.mother, 'Mor');
        if (person.family.spouse) {
          await addFamilyMember(person.family.spouse, 'Ektefelle');
        }
        if (person.family.siblings) {
          for (const id of person.family.siblings) {
            await addFamilyMember(id, 'Søsken');
          }
        }
        if (person.family.children) {
          for (const id of person.family.children) {
            await addFamilyMember(id, 'Barn');
          }
        }
      }

      setRelatedPersons(related);
      setFamilyMembers(family);
    }

    fetchPerson();
  }, [personId]);

  if (notFoundError) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Personer', href: '/personer' },
            { label: 'Ikke funnet' }
          ]} />
          <h1>Person ikke funnet</h1>
          <p>Personen du leter etter finnes ikke.</p>
          <Link to="/personer">Tilbake til personer</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Personer', href: '/personer' },
            { label: 'Laster...' }
          ]} />
          <p>Laster person...</p>
        </div>
      </div>
    );
  }

  if (error && !personData) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Personer', href: '/personer' },
            { label: 'Feil' }
          ]} />
          <h1>Feil</h1>
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

  if (!personData) {
    return null;
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Personer', href: '/personer' },
          { label: personData.name }
        ]} />

        <header className={styles.personHeader}>
          <h1>{personData.name}</h1>
          <p className={styles.title}>{personData.title}</p>

          <div className={styles.meta}>
            <span className={styles.eraBadge}>{eraLabels[personData.era] || personData.era}</span>
            {personData.roles.map((role, idx) => (
              <span key={idx} className={styles.roleBadge}>
                {roleLabels[role] || role}
              </span>
            ))}
            {personData.lifespan && (
              <span className={styles.lifespan}>{personData.lifespan}</span>
            )}
          </div>
        </header>

        <p className={styles.summary}>{personData.summary}</p>

        <div className={styles.taggingSection}>
          <ItemTagging itemType="person" itemId={personData.id} />
        </div>

        {familyMembers.length > 0 && (
          <section className={styles.familySection}>
            <h2>Familie</h2>
            <div className={styles.familyList}>
              {familyMembers.map((member, idx) => (
                <Link key={idx} to={`/personer/${member.id}`} className={styles.familyMember}>
                  <span className={styles.familyRelation}>{member.relation}</span>
                  <span className={styles.familyName}>{member.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.eventsSection}>
          <h2>Nøkkelhendelser</h2>
          <PersonVerseDisplay keyEvents={personData.keyEvents} />
        </section>

        {relatedPersons.length > 0 && (
          <section className={styles.relatedSection}>
            <h2>Relaterte personer</h2>
            <div className={styles.relatedList}>
              {relatedPersons.map((related) => (
                <Link key={related.id} to={`/personer/${related.id}`} className={styles.relatedPerson}>
                  <span className={styles.relatedName}>{related.name}</span>
                  <span className={styles.relatedTitle}>{related.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
