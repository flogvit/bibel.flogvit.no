import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import styles from '@/styles/pages/days-list.module.scss';

interface ReadingText {
  id: number;
  date: string;
  name: string;
  series: string | null;
}

const monthNames: Record<string, string> = {
  '01': 'Januar', '02': 'Februar', '03': 'Mars', '04': 'April',
  '05': 'Mai', '06': 'Juni', '07': 'Juli', '08': 'August',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember',
};

function formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  return `${monthNames[month] || month} ${year}`;
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getChurchYear(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  // Church year starts first Sunday of Advent (~late November)
  // Simplify: if month >= 11 (Nov/Dec), it's the start of next year's church year
  if (month >= 11) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

export function ReadingTextsPage() {
  const [texts, setTexts] = useState<ReadingText[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chronological' | 'churchYear'>('chronological');
  const todayRef = useRef<HTMLElement>(null);

  const today = new Date().toISOString().substring(0, 10);

  useEffect(() => {
    document.title = 'Lesetekster | bibel.flogvit.no';
    fetch('/api/reading-texts')
      .then(res => res.json())
      .then(data => setTexts(data.readingTexts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to today after load
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading]);

  // Filter and group
  const filtered = viewMode === 'chronological'
    ? texts.filter(t => t.date >= today)
    : texts;

  const grouped = new Map<string, ReadingText[]>();
  for (const text of filtered) {
    const key = viewMode === 'churchYear' ? getChurchYear(text.date) : text.date.substring(0, 7);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(text);
  }

  function formatGroupLabel(key: string): string {
    if (viewMode === 'churchYear') return `Kirkeåret ${key}`;
    return formatMonth(key);
  }

  // Find today's entry for highlighting
  const todayEntry = texts.find(t => t.date === today);

  return (
    <main className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[{ label: 'Lesetekster' }]} />
        <h1>Lesetekster</h1>
        <p style={{ color: 'var(--color-text-muted, #999)', marginBottom: '1.5rem' }}>
          Lesetekster fra Den norske kirkes tekstrekkesystem. Hver søndag og helligdag har tre lesetekster
          fra Det gamle testamente, brevlitteraturen og evangeliene.
        </p>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'chronological' ? styles.active : ''}`}
            onClick={() => setViewMode('chronological')}
          >
            Kronologisk
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'churchYear' ? styles.active : ''}`}
            onClick={() => setViewMode('churchYear')}
          >
            Kirkeår
          </button>
        </div>

        {loading ? (
          <p>Laster...</p>
        ) : texts.length === 0 ? (
          <p>Ingen lesetekster funnet.</p>
        ) : (
          Array.from(grouped.entries()).map(([key, groupTexts]) => (
            <section key={key} className={styles.categorySection}>
              <h2>{formatGroupLabel(key)}</h2>
              <div className={styles.dayList}>
                {groupTexts.map(text => {
                  const isToday = text.date === today;
                  return (
                    <Link
                      key={text.id}
                      to={`/lesetekster/${text.id}`}
                      className={styles.dayCard}
                      ref={isToday ? todayRef as any : undefined}
                      style={isToday ? { borderLeft: '3px solid var(--color-accent, #c9a959)' } : undefined}
                    >
                      <div className={styles.dayInfo}>
                        <span>{text.name}</span>
                        {text.series && <span className={styles.categoryTag}>{text.series}</span>}
                      </div>
                      <span className={styles.nextDate}>{formatDate(text.date)}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
