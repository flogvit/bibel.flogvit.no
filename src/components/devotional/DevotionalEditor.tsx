import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { DevotionalType } from '@/types/devotional';
import { devotionalTypeLabels } from '@/types/devotional';
import { useDevotionals } from '@/components/DevotionalsContext';
import { generateSlug } from '@/lib/devotional-utils';
import { MarkdownEditor, type MarkdownEditorHandle } from './MarkdownEditor';
import { DevotionalMarkdown } from './DevotionalMarkdown';
import { VerseInsertDialog } from './VerseInsertDialog';
import styles from './DevotionalEditor.module.scss';

export interface DevotionalEditorHandle {
  insertText: (text: string) => void;
}

interface DevotionalEditorProps {
  initialTitle?: string;
  initialSlug?: string;
  initialDate?: string;
  initialType?: DevotionalType;
  initialTags?: string[];
  initialContent?: string;
  onSave: (data: {
    title: string;
    slug?: string;
    date: string;
    type: DevotionalType;
    tags: string[];
    content: string;
  }) => void;
  onCancel: () => void;
  isEditing?: boolean;
  onLockVersion?: () => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  onContentChange?: (content: string) => void;
}

export const DevotionalEditor = forwardRef<DevotionalEditorHandle, DevotionalEditorProps>(function DevotionalEditor({
  initialTitle = '',
  initialSlug = '',
  initialDate = new Date().toISOString().split('T')[0],
  initialType = 'andakt',
  initialTags = [],
  initialContent = '',
  onSave,
  onCancel,
  isEditing,
  onLockVersion,
  showSidebar,
  onToggleSidebar,
  onContentChange,
}, ref) {
  const { getAllTags } = useDevotionals();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [date, setDate] = useState(initialDate);
  const [type, setType] = useState<DevotionalType>(initialType);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [showVerseDialog, setShowVerseDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [rawMode, setRawMode] = useState(false);

  // Helper: insert text at cursor in the active editor (CodeMirror or textarea)
  function insertAtCursor(text: string) {
    if (rawMode) {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart, selectionEnd } = ta;
      const newContent = content.substring(0, selectionStart) + text + content.substring(selectionEnd);
      const cursorPos = selectionStart + text.length;
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
        ta.focus();
      });
    } else {
      const view = editorRef.current?.view;
      if (!view) return;
      const { from } = view.state.selection.main;
      view.dispatch({
        changes: { from, to: from, insert: text },
        selection: { anchor: from + text.length },
      });
      view.focus();
    }
  }

  // Expose insertText for page-level sidebar
  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      insertAtCursor(text);
    },
  }));

  // Auto-generate slug from title when not manually edited
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManuallyEdited]);

  // Track unsaved changes
  useEffect(() => {
    const changed =
      title !== initialTitle ||
      slug !== initialSlug ||
      date !== initialDate ||
      type !== initialType ||
      JSON.stringify(tags) !== JSON.stringify(initialTags) ||
      content !== initialContent;
    setHasUnsavedChanges(changed);
  }, [title, slug, date, type, tags, content, initialTitle, initialSlug, initialDate, initialType, initialTags, initialContent]);

  // Notify parent of content changes
  useEffect(() => {
    onContentChange?.(content);
  }, [content, onContentChange]);

  // Warn before leaving with unsaved changes (browser navigation)
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept internal link clicks when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      // Skip inline verse refs – they expand in place, not navigate
      if (anchor.hasAttribute('data-inline-ref')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;
      if (!window.confirm('Du har ulagrede endringer. Vil du forlate siden?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges]);

  function insertMarkdown(prefix: string, suffix: string = '') {
    if (rawMode) {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart, selectionEnd } = ta;
      const selected = content.substring(selectionStart, selectionEnd);
      const insert = prefix + selected + suffix;
      const cursorPos = selected ? selectionStart + insert.length : selectionStart + prefix.length;
      const newContent = content.substring(0, selectionStart) + insert + content.substring(selectionEnd);
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
        ta.focus();
      });
    } else {
      const view = editorRef.current?.view;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const insert = prefix + selected + suffix;
      const cursorPos = selected ? from + insert.length : from + prefix.length;
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: cursorPos },
      });
      view.focus();
    }
  }

  function handleToolbar(action: string) {
    switch (action) {
      case 'bold': insertMarkdown('**', '**'); break;
      case 'italic': insertMarkdown('*', '*'); break;
      case 'strikethrough': insertMarkdown('~~', '~~'); break;
      case 'heading': insertMarkdown('### '); break;
      case 'list': insertMarkdown('- '); break;
      case 'orderedList': insertMarkdown('1. '); break;
      case 'quote': insertMarkdown('> '); break;
      case 'hr': insertMarkdown('\n---\n'); break;
      case 'link': insertMarkdown('[', '](url)'); break;
      case 'image': insertMarkdown('![', '](url)'); break;
      case 'verse': setShowVerseDialog(true); break;
    }
  }

  function handleVerseInsert(text: string) {
    insertAtCursor(text);
    setShowVerseDialog(false);
  }

  // Tag handling
  const allTags = getAllTags();
  const tagSuggestions = tagInput.trim()
    ? allTags.filter(t =>
        t.toLowerCase().includes(tagInput.toLowerCase()) &&
        !tags.includes(t)
      ).slice(0, 5)
    : allTags.filter(t => !tags.includes(t)).slice(0, 5);

  function handleAddTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  }

  function handleRemoveTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function handleSave() {
    if (!title.trim()) return;
    const finalSlug = slug.trim() || undefined;
    onSave({ title: title.trim(), slug: finalSlug, date, type, tags, content });
  }

  return (
    <div className={styles.editor}>
      {/* Frontmatter fields */}
      <div className={styles.frontmatter}>
        <button
          className={styles.frontmatterToggle}
          onClick={() => setShowMetadata(!showMetadata)}
          type="button"
        >
          <span className={styles.frontmatterToggleIcon}>{showMetadata ? '\u25BC' : '\u25B6'}</span>
          <span className={styles.frontmatterToggleTitle}>
            {title || 'Uten tittel'}
          </span>
          {!showMetadata && (
            <span className={styles.frontmatterSummary}>
              {date} · {devotionalTypeLabels[type]}{tags.length > 0 ? ` · ${tags.join(', ')}` : ''}
            </span>
          )}
        </button>

        {showMetadata && (
          <div className={styles.frontmatterFields}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tittel</label>
                <input
                  type="text"
                  className={styles.titleInput}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Tittel..."
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>URL-slug</label>
                <div className={styles.slugRow}>
                  <span className={styles.slugPrefix}>/manuskripter/</span>
                  <input
                    type="text"
                    className={styles.slugInput}
                    value={slug}
                    onChange={e => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="auto-generert-fra-tittel"
                  />
                  {slugManuallyEdited && (
                    <button
                      className={styles.slugReset}
                      onClick={() => {
                        setSlugManuallyEdited(false);
                        setSlug(generateSlug(title));
                      }}
                      title="Tilbakestill til auto-generert"
                      type="button"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Dato</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Type</label>
                <select
                  className={styles.typeSelect}
                  value={type}
                  onChange={e => setType(e.target.value as DevotionalType)}
                >
                  {(Object.entries(devotionalTypeLabels) as [DevotionalType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Emner</label>
              <div className={styles.tagsWrapper}>
                {tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button className={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>x</button>
                  </span>
                ))}
                <div className={styles.tagInputWrapper}>
                  <input
                    type="text"
                    className={styles.tagInput}
                    value={tagInput}
                    onChange={e => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (tagSuggestions.length > 0) {
                          handleAddTag(tagSuggestions[0]);
                        } else {
                          handleAddTag(tagInput);
                        }
                      }
                    }}
                    placeholder="Legg til emne..."
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className={styles.tagSuggestions}>
                      {tagSuggestions.map(tag => (
                        <div
                          key={tag}
                          className={styles.tagSuggestion}
                          onMouseDown={() => handleAddTag(tag)}
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarButtons}>
          <button className={styles.toolButton} onClick={() => handleToolbar('bold')} title="Fet">
            <strong>B</strong>
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('italic')} title="Kursiv">
            <em>I</em>
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('strikethrough')} title="Gjennomstreking">
            <s>S</s>
          </button>
          <span className={styles.toolSeparator} />
          <button className={styles.toolButton} onClick={() => handleToolbar('heading')} title="Overskrift">
            H
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('list')} title="Punktliste">
            {'\u25CF'}
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('orderedList')} title="Nummerert liste">
            1.
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('quote')} title="Sitat">
            &ldquo;
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('hr')} title="Skillelinje">
            &mdash;
          </button>
          <span className={styles.toolSeparator} />
          <button className={styles.toolButton} onClick={() => handleToolbar('link')} title="Lenke">
            {'\uD83D\uDD17'}
          </button>
          <button className={styles.toolButton} onClick={() => handleToolbar('image')} title="Bilde (URL)">
            {'\uD83D\uDDBC'}
          </button>
          <button className={`${styles.toolButton} ${styles.verseButton}`} onClick={() => handleToolbar('verse')} title="Sett inn versreferanse">
            Vers
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={`${styles.toolButton} ${styles.modeButton} ${rawMode ? styles.active : ''}`}
            onClick={() => setRawMode(!rawMode)}
            title={rawMode ? 'Bytt til rikt redigeringsmodus' : 'Bytt til ren markdown'}
          >
            {'</>'}
          </button>
          {onToggleSidebar && (
            <button
              className={`${styles.toolButton} ${styles.sidebarButton} ${showSidebar ? styles.active : ''}`}
              onClick={onToggleSidebar}
              title="Sidepanel"
            >
              Sidepanel
            </button>
          )}
          <button
            className={`${styles.previewToggle} ${showPreview ? styles.active : ''}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Skjul visning' : 'Forhåndsvis'}
          </button>
        </div>
      </div>

      {/* Editor area with optional preview */}
      <div className={`${styles.editorArea} ${showPreview ? styles.withPreview : ''}`}>
        <div className={styles.editorPane}>
          {rawMode ? (
            <textarea
              ref={textareaRef}
              className={styles.rawTextarea}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'Skriv manuskriptet ditt her...\n\nBruk [ref:Joh 3,16] for versreferanser.'}
            />
          ) : (
            <MarkdownEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              placeholder="Skriv manuskriptet ditt her...&#10;&#10;Bruk [ref:Joh 3,16] for versreferanser."
            />
          )}
        </div>

        {showPreview && (
          <div className={styles.preview}>
            {content ? (
              <DevotionalMarkdown content={content} />
            ) : (
              <p className={styles.previewEmpty}>Forhåndsvisning vises her...</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={() => {
          if (!hasUnsavedChanges || window.confirm('Du har ulagrede endringer. Vil du forlate siden?')) {
            onCancel();
          }
        }}>
          Avbryt
        </button>
        {isEditing && onLockVersion && (
          <button
            className={styles.lockVersionButton}
            onClick={onLockVersion}
            type="button"
          >
            Lagre som versjon
          </button>
        )}
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!title.trim()}
        >
          Lagre
        </button>
      </div>

      {/* Verse insert dialog */}
      {showVerseDialog && (
        <VerseInsertDialog
          onInsert={handleVerseInsert}
          onClose={() => setShowVerseDialog(false)}
        />
      )}

    </div>
  );
});
