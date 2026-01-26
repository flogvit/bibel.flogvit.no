

import { useState, useEffect } from 'react';
import { TimelinePanel } from './TimelinePanel';
import type { TimelineEvent } from '@/lib/bible';

interface TimelinePanelClientProps {
  currentBookId: number;
  currentChapter: number;
}

export function TimelinePanelClient({ currentBookId, currentChapter }: TimelinePanelClientProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTimeline() {
      try {
        const response = await fetch('/api/timeline');
        if (!response.ok) {
          throw new Error('Failed to fetch timeline');
        }
        const data = await response.json();
        if (!cancelled) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.warn('Failed to load timeline:', error);
        if (!cancelled) {
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTimeline();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return null; // The TimelinePanel handles its own visibility based on settings
  }

  return (
    <TimelinePanel
      events={events}
      currentBookId={currentBookId}
      currentChapter={currentChapter}
    />
  );
}
