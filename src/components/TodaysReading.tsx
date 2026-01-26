import { Link } from 'react-router-dom';
import { useReadingPlan } from './ReadingPlanContext';
import { getBookInfoById } from '@/lib/books-data';
import { toUrlSlug } from '@/lib/url-utils';
import styles from './TodaysReading.module.scss';

export function TodaysReading() {
  const {
    activePlan,
    activeProgress,
    todaysReading,
    currentDay,
    streak,
    completionPercentage,
    markComplete,
    loadingActivePlan,
  } = useReadingPlan();

  // Don't render anything if no active plan
  if (!activePlan || !activeProgress) {
    return null;
  }

  if (loadingActivePlan) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Laster...</div>
      </div>
    );
  }

  // Check if plan is completed
  const isCompleted = activeProgress.completedDays.length >= activePlan.days;

  if (isCompleted) {
    return (
      <div className={styles.container}>
        <div className={styles.completed}>
          <h3>Gratulerer!</h3>
          <p>Du har fullført &laquo;{activePlan.name}&raquo;!</p>
          <Link to="/leseplan" className={styles.startButton}>
            Velg en ny leseplan
          </Link>
        </div>
      </div>
    );
  }

  if (!todaysReading) {
    return null;
  }

  // Build chapter links
  const chapters = todaysReading.chapters.map(ch => {
    const book = getBookInfoById(ch.bookId);
    if (!book) return null;
    return {
      bookId: ch.bookId,
      chapter: ch.chapter,
      bookName: book.name_no,
      url: `/${toUrlSlug(book.short_name)}/${ch.chapter}`,
    };
  }).filter(Boolean);

  const handleMarkComplete = () => {
    markComplete(todaysReading.day);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Dagens lesing</h3>
        <Link to="/leseplan" className={styles.planLink}>
          {activePlan.name}
        </Link>
      </div>

      <div className={styles.dayInfo}>
        <span className={styles.dayNumber}>Dag {todaysReading.day} av {activePlan.days}</span>
        {streak > 0 && (
          <span className={styles.streak}>{streak} dager p&aring; rad</span>
        )}
      </div>

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <span className={styles.progressText}>{completionPercentage}% fullf&oslash;rt</span>
      </div>

      <div className={styles.chapters}>
        {chapters.map((ch, i) => ch && (
          <Link key={i} to={ch.url} className={styles.chapterLink}>
            {ch.bookName} {ch.chapter}
          </Link>
        ))}
      </div>

      <button onClick={handleMarkComplete} className={styles.completeButton}>
        Marker som lest
      </button>
    </div>
  );
}
