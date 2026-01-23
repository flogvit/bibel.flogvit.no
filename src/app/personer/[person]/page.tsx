import styles from './page.module.scss';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPersonData, getAllPersonsData, eraLabels, roleLabels } from '@/lib/bible';
import { PersonVerseDisplay } from '@/components/PersonVerseDisplay';

interface Props {
  params: Promise<{ person: string }>;
}

export async function generateStaticParams() {
  const persons = getAllPersonsData();
  return persons.map((person) => ({
    person: person.id,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { person } = await params;
  const personData = getPersonData(person);

  if (!personData) {
    return { title: 'Person ikke funnet' };
  }

  return {
    title: `${personData.name} - Bibelske personer`,
    description: personData.summary.slice(0, 160),
  };
}

export default async function PersonPage({ params }: Props) {
  const { person } = await params;
  const personData = getPersonData(person);

  if (!personData) {
    notFound();
  }

  // Get related persons data
  const relatedPersons = personData.relatedPersons
    ?.map(id => {
      const related = getPersonData(id);
      return related ? { id, name: related.name, title: related.title } : null;
    })
    .filter((p): p is { id: string; name: string; title: string } => p !== null) || [];

  // Get family members data
  const familyMembers: { id: string; name: string; relation: string }[] = [];
  if (personData.family) {
    const addFamilyMember = (id: string | null | undefined, relation: string) => {
      if (!id) return;
      const member = getPersonData(id);
      if (member) {
        familyMembers.push({ id, name: member.name, relation });
      }
    };

    addFamilyMember(personData.family.father, 'Far');
    addFamilyMember(personData.family.mother, 'Mor');
    if (personData.family.spouse) {
      addFamilyMember(personData.family.spouse, 'Ektefelle');
    }
    personData.family.siblings?.forEach(id => addFamilyMember(id, 'Søsken'));
    personData.family.children?.forEach(id => addFamilyMember(id, 'Barn'));
  }

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Link href="/personer" className={styles.backLink}>← Tilbake til personer</Link>

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

        {familyMembers.length > 0 && (
          <section className={styles.familySection}>
            <h2>Familie</h2>
            <div className={styles.familyList}>
              {familyMembers.map((member, idx) => (
                <Link key={idx} href={`/personer/${member.id}`} className={styles.familyMember}>
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
                <Link key={related.id} href={`/personer/${related.id}`} className={styles.relatedPerson}>
                  <span className={styles.relatedName}>{related.name}</span>
                  <span className={styles.relatedTitle}>{related.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
