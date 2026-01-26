import { useParams } from 'react-router-dom';
import { PersonContent } from '@/components/PersonContent';

export function PersonPage() {
  const { personId } = useParams<{ personId: string }>();

  if (!personId) {
    return (
      <div className="reading-container">
        <h1>Feil</h1>
        <p>Ugyldig person-ID</p>
      </div>
    );
  }

  return <PersonContent personId={personId} />;
}
