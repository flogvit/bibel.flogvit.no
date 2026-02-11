import { useState } from 'react';
import styles from './LockVersionDialog.module.scss';

interface LockVersionDialogProps {
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function LockVersionDialog({ onConfirm, onClose }: LockVersionDialogProps) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Lagre som versjon</h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <p className={styles.description}>
              Innholdet lagres som en versjon. En ny kopi opprettes som utkast.
            </p>
            <label className={styles.label}>Versjonsnavn</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="F.eks. «Ferdig utkast» eller «Versjon for s\u00f8ndagsskolen»"
              autoFocus
            />
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className={styles.confirmButton} disabled={!name.trim()}>
              Lagre versjon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
