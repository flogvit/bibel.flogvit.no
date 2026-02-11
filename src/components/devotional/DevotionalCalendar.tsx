import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Devotional } from '@/types/devotional';
import styles from './DevotionalCalendar.module.scss';

interface DevotionalCalendarProps {
  devotionals: Devotional[];
}

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];

export function DevotionalCalendar({ devotionals }: DevotionalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Map date strings to devotionals for this month
  const devotionalsByDate = useMemo(() => {
    const map = new Map<string, Devotional[]>();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    devotionals.forEach(d => {
      if (d.date.startsWith(prefix)) {
        const list = map.get(d.date) || [];
        list.push(d);
        map.set(d.date, list);
      }
    });

    return map;
  }, [devotionals, year, month]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Monday=0, Tuesday=1, ..., Sunday=6
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  function getDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={prevMonth} aria-label="Forrige måned">&lsaquo;</button>
        <span className={styles.monthYear}>{MONTHS[month]} {year}</span>
        <button className={styles.navButton} onClick={nextMonth} aria-label="Neste måned">&rsaquo;</button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className={styles.emptyDay} />;
          }

          const dateStr = getDateStr(day);
          const devs = devotionalsByDate.get(dateStr);
          const hasDevotionals = devs && devs.length > 0;

          return (
            <div
              key={day}
              className={`${styles.day} ${isToday(day) ? styles.today : ''} ${hasDevotionals ? styles.hasContent : ''}`}
            >
              <span className={styles.dayNumber}>{day}</span>
              {hasDevotionals && (
                <div className={styles.dayDevotionals}>
                  {devs!.map(d => (
                    <Link
                      key={d.id}
                      to={`/manuskripter/${d.slug}`}
                      className={styles.dayLink}
                      title={d.title}
                    >
                      {d.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
