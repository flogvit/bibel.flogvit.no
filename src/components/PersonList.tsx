'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from '@/app/personer/page.module.scss';

interface PersonListItem {
  id: string;
  name: string;
  title: string;
  era: string;
  eraLabel: string;
  roles: string[];
  roleLabels: string[];
  summary: string;
  searchText: string;
}

interface FilterOption {
  id: string;
  label: string;
}

interface PersonListProps {
  persons: PersonListItem[];
  eras: FilterOption[];
  roles: FilterOption[];
}

export function PersonList({ persons, eras, roles }: PersonListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const filteredPersons = useMemo(() => {
    let result = persons;

    // Filter by era
    if (selectedEra) {
      result = result.filter(p => p.era === selectedEra);
    }

    // Filter by role
    if (selectedRole) {
      result = result.filter(p => p.roles.includes(selectedRole));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const words = query.split(/\s+/);

      result = result
        .map(person => {
          let score = 0;
          const nameLower = person.name.toLowerCase();
          const searchTextLower = person.searchText.toLowerCase();

          // Exact name match = highest priority
          if (nameLower === query) {
            score += 100;
          }
          // Name starts with query
          else if (nameLower.startsWith(query)) {
            score += 50;
          }
          // Name contains query
          else if (nameLower.includes(query)) {
            score += 30;
          }

          // Check each word
          for (const word of words) {
            if (word.length < 2) continue;

            if (nameLower.includes(word)) {
              score += 20;
            }
            if (searchTextLower.includes(word)) {
              score += 5;
            }
          }

          return { person, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.person);
    }

    return result;
  }, [persons, searchQuery, selectedEra, selectedRole]);

  return (
    <>
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Søk etter personer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Søk etter bibelske personer"
        />
        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={() => setSearchQuery('')}
            aria-label="Tøm søk"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tidsepoke:</span>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterButton} ${!selectedEra ? styles.active : ''}`}
              onClick={() => setSelectedEra(null)}
            >
              Alle
            </button>
            {eras.map(era => (
              <button
                key={era.id}
                className={`${styles.filterButton} ${selectedEra === era.id ? styles.active : ''}`}
                onClick={() => setSelectedEra(selectedEra === era.id ? null : era.id)}
              >
                {era.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Rolle:</span>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterButton} ${!selectedRole ? styles.active : ''}`}
              onClick={() => setSelectedRole(null)}
            >
              Alle
            </button>
            {roles.map(role => (
              <button
                key={role.id}
                className={`${styles.filterButton} ${selectedRole === role.id ? styles.active : ''}`}
                onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(searchQuery || selectedEra || selectedRole) && (
        <p className={styles.searchInfo}>
          {filteredPersons.length} {filteredPersons.length === 1 ? 'person' : 'personer'} funnet
        </p>
      )}

      {filteredPersons.length === 0 ? (
        <p className={styles.noPersons}>
          {searchQuery || selectedEra || selectedRole
            ? 'Ingen personer matcher søket.'
            : 'Ingen personer tilgjengelig ennå.'}
        </p>
      ) : (
        <div className={styles.personList}>
          {filteredPersons.map((person) => (
            <Link
              key={person.id}
              href={`/personer/${person.id}`}
              className={styles.personCard}
            >
              <div className={styles.personHeader}>
                <h2 className={styles.personName}>{person.name}</h2>
              </div>
              <p className={styles.personTitle}>{person.title}</p>
              <div className={styles.personMeta}>
                <span className={styles.eraBadge}>{person.eraLabel}</span>
                {person.roleLabels.map((role, idx) => (
                  <span key={idx} className={styles.roleBadge}>{role}</span>
                ))}
              </div>
              <p className={styles.personSummary}>
                {person.summary.length > 150
                  ? person.summary.slice(0, 150) + '...'
                  : person.summary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
