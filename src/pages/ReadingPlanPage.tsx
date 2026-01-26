import { ReadingPlanProvider } from '@/components/ReadingPlanContext';
import { ReadingPlanClient } from '@/components/ReadingPlanClient';

export function ReadingPlanPage() {
  return (
    <ReadingPlanProvider>
      <ReadingPlanClient />
    </ReadingPlanProvider>
  );
}
