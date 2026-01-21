// Reading plan types and localStorage handling

export interface ReadingChapter {
  bookId: number;
  chapter: number;
}

export interface DayReading {
  day: number;
  chapters: ReadingChapter[];
}

export interface ReadingPlanSummary {
  id: string;
  name: string;
  description: string;
  category: 'kort' | 'middels' | 'lang';
  days: number;
}

export interface ReadingPlan extends ReadingPlanSummary {
  readings: DayReading[];
}

export interface ReadingPlanProgress {
  planId: string;
  startDate: string; // ISO date string
  completedDays: number[]; // Array of completed day numbers
  lastReadDate: string | null; // ISO date string of last reading
}

const ACTIVE_PLAN_KEY = 'activeReadingPlan';
const PROGRESS_KEY = 'readingPlanProgress';

// Get the active reading plan ID
export function getActivePlanId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(ACTIVE_PLAN_KEY);
  } catch {
    return null;
  }
}

// Set the active reading plan
export function setActivePlanId(planId: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (planId) {
      localStorage.setItem(ACTIVE_PLAN_KEY, planId);
    } else {
      localStorage.removeItem(ACTIVE_PLAN_KEY);
    }
  } catch (e) {
    console.error('Failed to save active plan:', e);
  }
}

// Get progress for all plans
export function getAllProgress(): Record<string, ReadingPlanProgress> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return {};
}

// Get progress for a specific plan
export function getPlanProgress(planId: string): ReadingPlanProgress | null {
  const allProgress = getAllProgress();
  return allProgress[planId] || null;
}

// Start a new reading plan
export function startReadingPlan(planId: string): ReadingPlanProgress {
  const progress: ReadingPlanProgress = {
    planId,
    startDate: new Date().toISOString().split('T')[0],
    completedDays: [],
    lastReadDate: null,
  };

  saveProgress(planId, progress);
  setActivePlanId(planId);
  return progress;
}

// Save progress for a plan
export function saveProgress(planId: string, progress: ReadingPlanProgress): void {
  if (typeof window === 'undefined') return;

  try {
    const allProgress = getAllProgress();
    allProgress[planId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

// Mark a day as completed
export function markDayCompleted(planId: string, dayNumber: number): ReadingPlanProgress | null {
  const progress = getPlanProgress(planId);
  if (!progress) return null;

  if (!progress.completedDays.includes(dayNumber)) {
    progress.completedDays.push(dayNumber);
    progress.completedDays.sort((a, b) => a - b);
  }
  progress.lastReadDate = new Date().toISOString().split('T')[0];

  saveProgress(planId, progress);
  return progress;
}

// Mark a day as not completed
export function markDayNotCompleted(planId: string, dayNumber: number): ReadingPlanProgress | null {
  const progress = getPlanProgress(planId);
  if (!progress) return null;

  progress.completedDays = progress.completedDays.filter(d => d !== dayNumber);
  saveProgress(planId, progress);
  return progress;
}

// Calculate which day we should be on based on start date
export function calculateCurrentDay(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // Day 1 is the start date
}

// Get today's reading for a plan
export function getTodaysReading(plan: ReadingPlan, progress: ReadingPlanProgress): DayReading | null {
  const currentDay = calculateCurrentDay(progress.startDate);

  // If we're past the plan's duration, return the last day
  const dayNumber = Math.min(currentDay, plan.days);

  // Find the next uncompleted day starting from today or earlier
  for (let day = dayNumber; day >= 1; day--) {
    if (!progress.completedDays.includes(day)) {
      return plan.readings.find(r => r.day === day) || null;
    }
  }

  // If all days up to today are completed, show the next uncompleted day
  for (let day = dayNumber + 1; day <= plan.days; day++) {
    if (!progress.completedDays.includes(day)) {
      return plan.readings.find(r => r.day === day) || null;
    }
  }

  // All days completed
  return null;
}

// Calculate streak (consecutive days of reading)
export function calculateStreak(progress: ReadingPlanProgress): number {
  if (!progress.lastReadDate) return 0;

  const lastRead = new Date(progress.lastReadDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastRead.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastRead.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If last read was more than 1 day ago, streak is broken
  if (diffDays > 1) return 0;

  // Count consecutive days backwards from last read date
  let streak = 0;
  const completedSet = new Set(progress.completedDays);
  const startDay = calculateCurrentDay(progress.startDate);

  for (let day = startDay; day >= 1; day--) {
    if (completedSet.has(day)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Calculate completion percentage
export function calculateCompletionPercentage(progress: ReadingPlanProgress, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((progress.completedDays.length / totalDays) * 100);
}

// Reset progress for a plan
export function resetProgress(planId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const allProgress = getAllProgress();
    delete allProgress[planId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));

    // If this was the active plan, clear it
    if (getActivePlanId() === planId) {
      setActivePlanId(null);
    }
  } catch (e) {
    console.error('Failed to reset progress:', e);
  }
}
