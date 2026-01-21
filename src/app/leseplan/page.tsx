import { Metadata } from 'next';
import { ReadingPlanClient } from './ReadingPlanClient';

export const metadata: Metadata = {
  title: 'Leseplaner | Bibelen',
  description: 'Velg en leseplan og les Bibelen systematisk.',
};

export default function LeseplanPage() {
  return <ReadingPlanClient />;
}
