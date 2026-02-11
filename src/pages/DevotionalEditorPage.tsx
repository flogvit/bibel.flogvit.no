import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDevotionals } from '@/components/DevotionalsContext';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DevotionalEditor, type DevotionalEditorHandle } from '@/components/devotional/DevotionalEditor';
import { LockVersionDialog } from '@/components/devotional/LockVersionDialog';
import { BibleLookupPanel } from '@/components/devotional/BibleLookupPanel';
import { DevotionalSearchPanel } from '@/components/devotional/DevotionalSearchPanel';
import { ChapterContextPanel, type ChapterContextData } from '@/components/devotional/ChapterContextPanel';
import { TimelineContextPanel } from '@/components/devotional/TimelineContextPanel';
import { getCurrentContent } from '@/lib/devotional-utils';
import type { DevotionalType } from '@/types/devotional';
import styles from '@/styles/pages/devotionals.module.scss';

export function DevotionalEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getDevotionalBySlug, addDevotional, updateDevotional, updateDraftContent, lockVersion } = useDevotionals();
  const editorRef = useRef<DevotionalEditorHandle>(null);

  const isEditing = !!slug;
  const existing = isEditing ? getDevotionalBySlug(slug!) : undefined;

  const prefilledVerse = searchParams.get('vers');
  const initialContent = existing ? getCurrentContent(existing) : (prefilledVerse ? `[vers:${prefilledVerse}]\n\n` : '');

  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'bible' | 'manuscripts' | 'context' | 'timeline'>('bible');
  const [editorContent, setEditorContent] = useState(initialContent);
  const [chapterContextData, setChapterContextData] = useState<ChapterContextData[]>([]);

  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  const handleContextDataChange = useCallback((data: ChapterContextData[]) => {
    setChapterContextData(data);
  }, []);

  function handleSave(data: {
    title: string;
    slug?: string;
    date: string;
    type: DevotionalType;
    tags: string[];
    content: string;
  }) {
    if (isEditing && existing) {
      updateDevotional(existing.id, {
        title: data.title,
        slug: data.slug,
        date: data.date,
        type: data.type,
        tags: data.tags,
      });
      updateDraftContent(existing.id, data.content);
      const newSlug = data.slug || existing.slug;
      navigate(`/manuskripter/${newSlug}`);
    } else {
      const newDev = addDevotional(data);
      navigate(`/manuskripter/${newDev.slug}`);
    }
  }

  function handleCancel() {
    if (isEditing && existing) {
      navigate(`/manuskripter/${existing.slug}`);
    } else {
      navigate('/manuskripter');
    }
  }

  function handleLockVersion(name: string) {
    if (existing) {
      lockVersion(existing.id, name);
      setShowLockDialog(false);
    }
  }

  function handleInsertText(text: string) {
    editorRef.current?.insertText(text);
  }

  if (isEditing && !existing) {
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
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorPage}>
      <div className={styles.editorPageHeader}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Manuskripter', href: '/manuskripter' },
          { label: isEditing ? 'Rediger' : 'Nytt manuskript' },
        ]} />
        <h1 className={styles.editorTitle}>{isEditing ? 'Rediger manuskript' : 'Nytt manuskript'}</h1>
      </div>

      <div className={`${styles.editorLayout} ${showSidebar ? styles.withSidebar : ''}`}>
        <div className={styles.editorMain}>
          <DevotionalEditor
            ref={editorRef}
            initialTitle={existing?.title}
            initialSlug={existing?.slug}
            initialDate={existing?.date}
            initialType={existing?.type}
            initialTags={existing?.tags}
            initialContent={initialContent}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={isEditing}
            onLockVersion={() => setShowLockDialog(true)}
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onContentChange={handleContentChange}
          />
        </div>

        {showSidebar && (
          <aside className={styles.editorSidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTabs}>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === 'bible' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('bible')}
                >
                  Bibel
                </button>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === 'manuscripts' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('manuscripts')}
                >
                  Manuskripter
                </button>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === 'context' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('context')}
                >
                  Kontekst
                </button>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === 'timeline' ? styles.sidebarTabActive : ''}`}
                  onClick={() => setSidebarTab('timeline')}
                >
                  Tidslinje
                </button>
              </div>
              <button className={styles.sidebarClose} onClick={() => setShowSidebar(false)}>×</button>
            </div>

            <div className={styles.sidebarContent}>
              {sidebarTab === 'bible' && (
                <BibleLookupPanel onInsert={handleInsertText} />
              )}

              {sidebarTab === 'manuscripts' && (
                <DevotionalSearchPanel
                  onClose={() => setShowSidebar(false)}
                  onInsertText={handleInsertText}
                  currentDevotionalId={existing?.id}
                />
              )}

              {/* ChapterContextPanel always mounted to keep data fresh for timeline */}
              <div style={{ display: sidebarTab === 'context' ? 'block' : 'none' }}>
                <ChapterContextPanel content={editorContent} onDataChange={handleContextDataChange} />
              </div>

              {sidebarTab === 'timeline' && (
                <TimelineContextPanel contextData={chapterContextData} />
              )}
            </div>
          </aside>
        )}
      </div>

      {showLockDialog && (
        <LockVersionDialog
          onConfirm={handleLockVersion}
          onClose={() => setShowLockDialog(false)}
        />
      )}
    </div>
  );
}
