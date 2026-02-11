import { useState } from 'react';
import type { DevotionalPresentation } from '@/types/devotional';
import styles from './PresentationDialog.module.scss';

interface PresentationDialogProps {
  initial?: DevotionalPresentation;
  onSave: (data: Omit<DevotionalPresentation, 'id'>) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export function PresentationDialog({ initial, onSave, onRemove, onClose }: PresentationDialogProps) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState(initial?.location ?? '');
  const [event, setEvent] = useState(initial?.event ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      date,
      location: location.trim() || undefined,
      event: event.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{initial ? 'Rediger fremf\u00f8ring' : 'Legg til fremf\u00f8ring'}</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Dato *</label>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Sted</label>
              <input
                type="text"
                className={styles.input}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="F.eks. Betania, Bergen"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Arrangement</label>
              <input
                type="text"
                className={styles.input}
                value={event}
                onChange={e => setEvent(e.target.value)}
                placeholder="F.eks. S\u00f8ndagsmesse"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Notater</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Valgfrie notater..."
                rows={3}
              />
            </div>
          </div>
          <div className={styles.footer}>
            {onRemove && (
              <button type="button" className={styles.removeButton} onClick={onRemove}>
                Fjern
              </button>
            )}
            <div className={styles.footerRight}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Avbryt
              </button>
              <button type="submit" className={styles.saveButton}>
                Lagre
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
