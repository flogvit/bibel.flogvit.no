'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/components/SettingsContext';
import {
  ChapterInsight,
  GenealogyInsight,
  ListInsight,
  TwoColumnInsight,
  PersonListInsight,
  CreationInsight,
  FaithHeroesInsight,
} from '@/data/chapterInsightTypes';
import styles from './ChapterInsightsPanel.module.scss';

interface ChapterInsightsPanelProps {
  bookId: number;
  chapter: number;
  insight: ChapterInsight | null;
}

export function ChapterInsightsPanel({ insight }: ChapterInsightsPanelProps) {
  const { settings } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!settings.showChapterInsights || !insight) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.toggleIcon}>{isExpanded ? '−' : '+'}</span>
        <span>{insight.buttonText}</span>
        <span className={styles.toggleHint}>
          {isExpanded ? 'Klikk for å skjule' : insight.hint}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          <p className={styles.intro}>{insight.intro}</p>
          <InsightContent insight={insight} />
        </div>
      )}
    </section>
  );
}

function InsightContent({ insight }: { insight: ChapterInsight }) {
  switch (insight.type) {
    case 'genealogy':
      return <GenealogyContent insight={insight} />;
    case 'list':
      return <ListContent insight={insight} />;
    case 'two-column':
      return <TwoColumnContent insight={insight} />;
    case 'person-list':
      return <PersonListContent insight={insight} />;
    case 'creation':
      return <CreationContent insight={insight} />;
    case 'faith-heroes':
      return <FaithHeroesContent insight={insight} />;
    default:
      return null;
  }
}

function GenealogyContent({ insight }: { insight: GenealogyInsight }) {
  return (
    <>
      <div className={styles.sections}>
        {insight.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {section.title}
              <span className={styles.verseRef}>v.{section.startVerse}-{section.endVerse}</span>
            </h3>
            <div className={styles.personList}>
              {section.persons.map((person, personIndex) => (
                <div key={personIndex} className={styles.personItem}>
                  {personIndex > 0 && <span className={styles.arrow}>→</span>}
                  <span className={styles.person}>
                    {person.personId ? (
                      <Link
                        href={`/personer/${person.personId}`}
                        className={styles.personLink}
                        title={`Les mer om ${person.name}`}
                      >
                        {person.name}
                      </Link>
                    ) : (
                      <span className={styles.personName}>{person.name}</span>
                    )}
                    {person.years && (
                      <span className={styles.personYears}>{person.years}</span>
                    )}
                    {person.note && (
                      <span className={styles.personNote}>{person.note}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {insight.footer && (
        <div className={styles.footer}>
          <h4>{insight.footer.title}</h4>
          <p>
            {insight.footer.content}
            {insight.footer.links && (
              <>
                {' '}
                {insight.footer.links.map((link, i) => (
                  <span key={link.personId}>
                    {i > 0 && ', '}
                    <Link href={`/personer/${link.personId}`} className={styles.footerLink}>
                      {link.text}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
}

function ListContent({ insight }: { insight: ListInsight }) {
  return (
    <div className={styles.listContainer}>
      {insight.items.map((item, index) => (
        <div key={index} className={styles.listItem}>
          {item.number && <span className={styles.listNumber}>{item.number}</span>}
          <div className={styles.listContent}>
            <h4 className={styles.listTitle}>{item.title}</h4>
            <p className={styles.listText}>{item.text}</p>
            <span className={styles.listVerses}>v.{item.verses.join(', ')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TwoColumnContent({ insight }: { insight: TwoColumnInsight }) {
  return (
    <>
      <div className={styles.twoColumn}>
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>{insight.leftTitle}</h4>
          <span className={styles.columnVerses}>v.{insight.verses.left.join('-')}</span>
          <ul className={styles.columnList}>
            {insight.leftItems.map((item, index) => (
              <li key={index} className={styles.columnItem}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div className={styles.columnDivider} />
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>{insight.rightTitle}</h4>
          <span className={styles.columnVerses}>v.{insight.verses.right.join('-')}</span>
          <ul className={styles.columnList}>
            {insight.rightItems.map((item, index) => (
              <li key={index} className={styles.columnItem}>{item.text}</li>
            ))}
          </ul>
        </div>
      </div>
      {insight.footer && (
        <div className={styles.footer}>
          <p>{insight.footer}</p>
        </div>
      )}
    </>
  );
}

function PersonListContent({ insight }: { insight: PersonListInsight }) {
  return (
    <div className={styles.personGrid}>
      {insight.persons.map((person, index) => (
        <div key={index} className={styles.personCard}>
          <span className={styles.personNumber}>{index + 1}</span>
          <div className={styles.personInfo}>
            {person.personId ? (
              <Link href={`/personer/${person.personId}`} className={styles.personCardName}>
                {person.name}
              </Link>
            ) : (
              <span className={styles.personCardName}>{person.name}</span>
            )}
            <p className={styles.personDescription}>{person.description}</p>
            {person.note && <span className={styles.personCardNote}>{person.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreationContent({ insight }: { insight: CreationInsight }) {
  return (
    <div className={styles.creationTimeline}>
      {insight.days.map((day) => (
        <div key={day.day} className={styles.creationDay}>
          <div className={styles.dayNumber}>
            <span>Dag {day.day}</span>
          </div>
          <div className={styles.dayContent}>
            <h4 className={styles.dayTitle}>{day.title}</h4>
            <ul className={styles.dayCreated}>
              {day.created.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <span className={styles.dayVerses}>v.{day.verses[0]}-{day.verses[day.verses.length - 1]}</span>
          </div>
        </div>
      ))}
      <div className={styles.creationDay}>
        <div className={`${styles.dayNumber} ${styles.dayRest}`}>
          <span>Dag 7</span>
        </div>
        <div className={styles.dayContent}>
          <h4 className={styles.dayTitle}>Hvile</h4>
          <p className={styles.dayDescription}>Gud fullførte sitt verk og hvilte. Han velsignet og helliget den sjuende dagen.</p>
        </div>
      </div>
    </div>
  );
}

function FaithHeroesContent({ insight }: { insight: FaithHeroesInsight }) {
  return (
    <div className={styles.heroesGrid}>
      {insight.heroes.map((hero, index) => (
        <div key={index} className={styles.heroCard}>
          {hero.personId ? (
            <Link href={`/personer/${hero.personId}`} className={styles.heroName}>
              {hero.name}
            </Link>
          ) : (
            <span className={styles.heroName}>{hero.name}</span>
          )}
          <p className={styles.heroDeed}>{hero.deed}</p>
          <span className={styles.heroVerses}>v.{hero.verses.join(', ')}</span>
        </div>
      ))}
    </div>
  );
}
