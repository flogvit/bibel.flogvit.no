import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDevotionals } from '@/components/DevotionalsContext';
import { useSettings } from '@/components/SettingsContext';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DevotionalMarkdown } from '@/components/devotional/DevotionalMarkdown';
import { PresentationDialog } from '@/components/devotional/PresentationDialog';
import { devotionalTypeLabels } from '@/types/devotional';
import type { DevotionalPresentation } from '@/types/devotional';
import { getRelatedDevotionals, verseRefToReadable, verseRefToUrl, getCurrentContent, getLockedVersions } from '@/lib/devotional-utils';
import styles from '@/styles/pages/devotional-view.module.scss';

export function DevotionalViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { devotionals, getDevotionalBySlug, deleteDevotional, addPresentation, updatePresentation, removePresentation, duplicateVersionToNew } = useDevotionals();

  const { settings } = useSettings();
  const devotional = slug ? getDevotionalBySlug(slug) : undefined;
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [presentationDialogVersionId, setPresentationDialogVersionId] = useState<string | null>(null);
  const [editingPresentation, setEditingPresentation] = useState<DevotionalPresentation | null>(null);

  if (!devotional) {
    return (
      <div className={styles.main}>
        <div className="reading-container">
          <Breadcrumbs items={[
            { label: 'Hjem', href: '/' },
            { label: 'Manuskripter', href: '/manuskripter' },
            { label: 'Ikke funnet' },
          ]} />
          <h1>Manuskript ikke funnet</h1>
          <p>Dette manuskriptet finnes ikke.</p>
          <Link to="/manuskripter">Tilbake til manuskripter</Link>
        </div>
      </div>
    );
  }

  const related = getRelatedDevotionals(devotional, devotionals);
  const lockedVersions = getLockedVersions(devotional);
  const viewingVersion = viewingVersionId
    ? devotional.versions.find(v => v.id === viewingVersionId)
    : null;
  const displayContent = viewingVersion ? viewingVersion.content : getCurrentContent(devotional);

  function handleDelete() {
    if (confirm('Er du sikker på at du vil slette dette manuskriptet?')) {
      deleteDevotional(devotional!.id);
      navigate('/manuskripter');
    }
  }

  function handleDuplicate(versionId: string) {
    const newDev = duplicateVersionToNew(devotional!.id, versionId);
    if (newDev) {
      navigate(`/manuskripter/${newDev.slug}/rediger`);
    }
  }

  function handleSavePresentation(data: Omit<DevotionalPresentation, 'id'>) {
    if (!presentationDialogVersionId) return;

    if (editingPresentation) {
      updatePresentation(devotional!.id, presentationDialogVersionId, editingPresentation.id, data);
    } else {
      addPresentation(devotional!.id, presentationDialogVersionId, data);
    }

    setPresentationDialogVersionId(null);
    setEditingPresentation(null);
  }

  function handleEditPresentation(versionId: string, presentation: DevotionalPresentation) {
    setPresentationDialogVersionId(versionId);
    setEditingPresentation(presentation);
  }

  function handleRemovePresentation(versionId: string, presentationId: string) {
    if (confirm('Fjerne denne fremf\u00f8ringen?')) {
      removePresentation(devotional!.id, versionId, presentationId);
    }
  }

  return (
    <div className={styles.main}>
      <div className="reading-container">
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Manuskripter', href: '/manuskripter' },
          { label: devotional.title },
        ]} />

        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={`${styles.typeBadge} ${styles[`type_${devotional.type}`]}`}>
                {devotionalTypeLabels[devotional.type]}
              </span>
              <time className={styles.date} dateTime={devotional.date}>
                {new Date(devotional.date + 'T00:00:00').toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </div>
            <h1 className={styles.title}>{devotional.title}</h1>
            {!settings.readingMode && devotional.tags.length > 0 && (
              <div className={styles.tags}>
                {devotional.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </header>

          {viewingVersion && (
            <div className={styles.versionBanner}>
              <span>Viser versjon: <strong>{viewingVersion.name}</strong></span>
              <button
                className={styles.backToDraftButton}
                onClick={() => setViewingVersionId(null)}
              >
                Tilbake til utkast
              </button>
            </div>
          )}

          <div className={`${styles.content} ${settings.readingMode ? styles.contentReadMode : ''}`}>
            <DevotionalMarkdown content={displayContent} />
          </div>

          {!settings.readingMode && <footer className={styles.footer}>
            {devotional.verses.length > 0 && (
              <div className={styles.versesList}>
                <h3 className={styles.footerTitle}>Versreferanser</h3>
                <div className={styles.versesLinks}>
                  {devotional.verses.map(ref => (
                    <Link key={ref} to={verseRefToUrl(ref)} className={styles.verseLink}>
                      {verseRefToReadable(ref)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className={styles.related}>
                <h3 className={styles.footerTitle}>Relaterte manuskripter</h3>
                <div className={styles.relatedList}>
                  {related.map(r => (
                    <Link key={r.id} to={`/manuskripter/${r.slug}`} className={styles.relatedItem}>
                      <span className={styles.relatedTitle}>{r.title}</span>
                      <span className={styles.relatedDate}>
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {lockedVersions.length > 0 && (
              <div className={styles.versionHistory}>
                <h3 className={styles.footerTitle}>Versjonshistorikk</h3>
                <div className={styles.versionList}>
                  {lockedVersions.map(v => (
                    <div key={v.id} className={styles.versionItem}>
                      <div className={styles.versionInfo}>
                        <span className={styles.versionName}>{v.name}</span>
                        <span className={styles.versionDate}>
                          {new Date(v.createdAt).toLocaleDateString('nb-NO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {v.presentations.length > 0 && (
                          <div className={styles.presentationBadges}>
                            {v.presentations.map(p => (
                              <span
                                key={p.id}
                                className={styles.presentationBadge}
                                title={[p.location, p.event].filter(Boolean).join(' — ')}
                                onClick={() => handleEditPresentation(v.id, p)}
                              >
                                {new Date(p.date + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                                {p.location ? ` — ${p.location}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.versionActions}>
                        <button
                          className={styles.versionActionButton}
                          onClick={() => setViewingVersionId(viewingVersionId === v.id ? null : v.id)}
                        >
                          {viewingVersionId === v.id ? 'Skjul' : 'Vis'}
                        </button>
                        <button
                          className={styles.versionActionButton}
                          onClick={() => {
                            setPresentationDialogVersionId(v.id);
                            setEditingPresentation(null);
                          }}
                        >
                          Fremføring
                        </button>
                        <button
                          className={styles.versionActionButton}
                          onClick={() => handleDuplicate(v.id)}
                        >
                          Dupliser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Link to={`/manuskripter/${devotional.slug}/rediger`} className={styles.editButton}>
                Rediger
              </Link>
              <button className={styles.deleteButton} onClick={handleDelete}>
                Slett
              </button>
            </div>
          </footer>}
        </article>
      </div>

      {presentationDialogVersionId && (
        <PresentationDialog
          initial={editingPresentation ?? undefined}
          onSave={handleSavePresentation}
          onRemove={editingPresentation ? () => {
            handleRemovePresentation(presentationDialogVersionId, editingPresentation.id);
            setPresentationDialogVersionId(null);
            setEditingPresentation(null);
          } : undefined}
          onClose={() => {
            setPresentationDialogVersionId(null);
            setEditingPresentation(null);
          }}
        />
      )}
    </div>
  );
}
