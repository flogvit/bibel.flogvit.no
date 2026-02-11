import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getVerseLists, saveVerseLists, type VerseList } from '@/lib/offline/userData';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { toUrlSlug } from '@/lib/url-utils';
import type { VerseWithOriginal, Book } from '@/lib/bible';
import styles from '@/styles/pages/verselists.module.scss';

interface ParsedRef {
  bookSlug: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  raw: string;
}

function refToString(ref: ParsedRef): string {
  if (ref.verseStart === ref.verseEnd) {
    return `${ref.bookSlug}-${ref.chapter}-${ref.verseStart}`;
  }
  return `${ref.bookSlug}-${ref.chapter}-${ref.verseStart}-${ref.verseEnd}`;
}

function parseRefString(ref: string): ParsedRef | null {
  const parts = ref.trim().split('-');
  if (parts.length < 3) return null;

  const bookSlug = parts[0];
  const chapter = parseInt(parts[1], 10);
  const verseStart = parseInt(parts[2], 10);
  const verseEnd = parts[3] ? parseInt(parts[3], 10) : verseStart;

  if (isNaN(chapter) || isNaN(verseStart) || isNaN(verseEnd)) return null;

  return { bookSlug, chapter, verseStart, verseEnd, raw: ref.trim() };
}

export function VerseListsPage() {
  const [lists, setLists] = useState<VerseList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [refInput, setRefInput] = useState('');
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const [verses, setVerses] = useState<VerseWithOriginal[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const newNameRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLTextAreaElement>(null);

  const selectedList = lists.find(l => l.id === selectedListId) || null;

  // Load lists on mount
  useEffect(() => {
    getVerseLists().then(setLists);
    fetch('/api/books').then(r => r.json()).then(data => setBooks(data.books));
  }, []);

  // Load verses when selected list changes
  useEffect(() => {
    if (!selectedList || selectedList.refs.length === 0) {
      setVerses([]);
      return;
    }

    loadVerses(selectedList.refs);
  }, [selectedListId, selectedList?.refs.join(',')]);

  async function loadVerses(refs: string[]) {
    if (books.length === 0) return;

    setVersesLoading(true);
    try {
      const verseRefs = [];
      for (const ref of refs) {
        const parsed = parseRefString(ref);
        if (!parsed) continue;

        const book = books.find(b => toUrlSlug(b.short_name) === parsed.bookSlug);
        if (!book) continue;

        const verseNumbers: number[] = [];
        for (let v = parsed.verseStart; v <= parsed.verseEnd; v++) {
          verseNumbers.push(v);
        }

        verseRefs.push({
          bookId: book.id,
          chapter: parsed.chapter,
          verses: verseNumbers,
        });
      }

      if (verseRefs.length === 0) {
        setVerses([]);
        setVersesLoading(false);
        return;
      }

      const response = await fetch('/api/verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs: verseRefs }),
      });

      if (!response.ok) throw new Error('Failed to fetch verses');
      const data: VerseWithOriginal[] = await response.json();
      setVerses(data);
    } catch (err) {
      console.error('Error loading verses:', err);
    } finally {
      setVersesLoading(false);
    }
  }

  async function persistLists(updated: VerseList[]) {
    setLists(updated);
    await saveVerseLists(updated);
  }

  function handleCreateList() {
    if (!newName.trim()) return;

    const now = Date.now();
    const newList: VerseList = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      refs: [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...lists, newList];
    persistLists(updated);
    setSelectedListId(newList.id);
    setNewName('');
    setNewDescription('');
    setShowNewForm(false);
  }

  function handleDeleteList(listId: string) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    if (!confirm(`Er du sikker på at du vil slette "${list.name}"?`)) return;

    const updated = lists.filter(l => l.id !== listId);
    persistLists(updated);
    if (selectedListId === listId) {
      setSelectedListId(null);
    }
  }

  function handleStartEdit(list: VerseList) {
    setEditingListId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || '');
  }

  function handleSaveEdit() {
    if (!editingListId || !editName.trim()) return;

    const updated = lists.map(l =>
      l.id === editingListId
        ? { ...l, name: editName.trim(), description: editDescription.trim() || undefined, updatedAt: Date.now() }
        : l
    );
    persistLists(updated);
    setEditingListId(null);
    setEditName('');
    setEditDescription('');
  }

  async function handleAddRefs() {
    if (!selectedList || !refInput.trim()) return;

    setRefLoading(true);
    setRefError(null);

    // Split on semicolons, newlines, or commas followed by a space+letter (new reference).
    // This preserves "joh 3,16" (comma between chapter and verse) while splitting "joh 3,16, 1 mos 1,1".
    const parts = refInput.split(/[;\n]+|,\s*(?=[a-zæøå\d]\s*\.?\s*[a-zæøå])/i).map(s => s.trim()).filter(Boolean);
    const newRefs: string[] = [];
    const errors: string[] = [];

    for (const part of parts) {
      try {
        const response = await fetch(`/api/reference?q=${encodeURIComponent(part)}`);
        const data = await response.json();

        if (data.success && data.reference) {
          // Build ref string from the parsed reference
          const bookSlug = toUrlSlug(data.reference.book.short_name);
          const chapter = data.reference.chapter;
          const verseStart = data.reference.verseStart || 1;
          const verseEnd = data.reference.verseEnd || verseStart;

          if (verseStart === verseEnd) {
            newRefs.push(`${bookSlug}-${chapter}-${verseStart}`);
          } else {
            newRefs.push(`${bookSlug}-${chapter}-${verseStart}-${verseEnd}`);
          }
        } else {
          // Try parsing as already formatted ref (e.g. "joh-3-16")
          const parsed = parseRefString(part);
          if (parsed) {
            newRefs.push(refToString(parsed));
          } else {
            errors.push(part);
          }
        }
      } catch {
        errors.push(part);
      }
    }

    if (newRefs.length > 0) {
      const updated = lists.map(l =>
        l.id === selectedList.id
          ? { ...l, refs: [...l.refs, ...newRefs], updatedAt: Date.now() }
          : l
      );
      persistLists(updated);
      setRefInput('');
    }

    if (errors.length > 0) {
      setRefError(`Kunne ikke tolke: ${errors.join(', ')}`);
    }

    setRefLoading(false);
  }

  function handleRemoveRef(index: number) {
    if (!selectedList) return;

    const updated = lists.map(l =>
      l.id === selectedList.id
        ? { ...l, refs: l.refs.filter((_, i) => i !== index), updatedAt: Date.now() }
        : l
    );
    persistLists(updated);
  }

  function handleMoveRef(index: number, direction: 'up' | 'down') {
    if (!selectedList) return;

    const newRefs = [...selectedList.refs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRefs.length) return;

    [newRefs[index], newRefs[targetIndex]] = [newRefs[targetIndex], newRefs[index]];

    const updated = lists.map(l =>
      l.id === selectedList.id
        ? { ...l, refs: newRefs, updatedAt: Date.now() }
        : l
    );
    persistLists(updated);
  }

  function handleCopyLink() {
    if (!selectedList || selectedList.refs.length === 0) return;

    const url = `${window.location.origin}/tekst?refs=${selectedList.refs.join(',')}`;
    navigator.clipboard.writeText(url);
  }

  function getRefLabel(ref: string): string {
    const parsed = parseRefString(ref);
    if (!parsed) return ref;

    const book = books.find(b => toUrlSlug(b.short_name) === parsed.bookSlug);
    const bookName = book ? book.short_name : parsed.bookSlug;

    if (parsed.verseStart === parsed.verseEnd) {
      return `${bookName} ${parsed.chapter}:${parsed.verseStart}`;
    }
    return `${bookName} ${parsed.chapter}:${parsed.verseStart}-${parsed.verseEnd}`;
  }

  // Group verses by ref for display
  function getVersesForRef(ref: string): VerseWithOriginal[] {
    const parsed = parseRefString(ref);
    if (!parsed) return [];

    const book = books.find(b => toUrlSlug(b.short_name) === parsed.bookSlug);
    if (!book) return [];

    return verses.filter(v =>
      v.verse.book_id === book.id &&
      v.verse.chapter === parsed.chapter &&
      v.verse.verse >= parsed.verseStart &&
      v.verse.verse <= parsed.verseEnd
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Verslister' }
        ]} />
        <header className={styles.header}>
          <h1>Mine verslister</h1>
          <p className={styles.intro}>
            Samle bibelvers i navngitte lister for manuskripter, bibeltimer eller studier.
          </p>
        </header>

        <div className={styles.content}>
          <div className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2>Lister ({lists.length})</h2>
              <button
                className={styles.addButton}
                onClick={() => {
                  setShowNewForm(true);
                  setTimeout(() => newNameRef.current?.focus(), 50);
                }}
                title="Ny liste"
              >
                +
              </button>
            </div>

            {showNewForm && (
              <div className={styles.newForm}>
                <input
                  ref={newNameRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateList();
                    if (e.key === 'Escape') { setShowNewForm(false); setNewName(''); setNewDescription(''); }
                  }}
                  placeholder="Listenavn..."
                  className={styles.nameInput}
                />
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateList();
                    if (e.key === 'Escape') { setShowNewForm(false); setNewName(''); setNewDescription(''); }
                  }}
                  placeholder="Beskrivelse (valgfritt)..."
                  className={styles.descInput}
                />
                <div className={styles.formActions}>
                  <button onClick={handleCreateList} className={styles.saveButton} disabled={!newName.trim()}>
                    Opprett
                  </button>
                  <button onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }} className={styles.cancelButton}>
                    Avbryt
                  </button>
                </div>
              </div>
            )}

            {lists.length === 0 && !showNewForm ? (
              <p className={styles.emptyHint}>Ingen lister ennå. Klikk + for å opprette en.</p>
            ) : (
              lists.map(list => (
                <div
                  key={list.id}
                  className={`${styles.listItem} ${selectedListId === list.id ? styles.selected : ''}`}
                >
                  {editingListId === list.id ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingListId(null);
                        }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingListId(null);
                        }}
                        placeholder="Beskrivelse..."
                      />
                      <div className={styles.formActions}>
                        <button onClick={handleSaveEdit} className={styles.saveButton}>Lagre</button>
                        <button onClick={() => setEditingListId(null)} className={styles.cancelButton}>Avbryt</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className={styles.listButton}
                        onClick={() => setSelectedListId(selectedListId === list.id ? null : list.id)}
                      >
                        <span className={styles.listName}>{list.name}</span>
                        <span className={styles.refCount}>
                          {list.refs.length} {list.refs.length === 1 ? 'referanse' : 'referanser'}
                        </span>
                      </button>
                      <div className={styles.listActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleStartEdit(list)}
                          title="Rediger"
                        >
                          ✎
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteList(list.id)}
                          title="Slett"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.detailPanel}>
            {selectedList ? (
              <>
                <div className={styles.detailHeader}>
                  <h2>{selectedList.name}</h2>
                  {selectedList.description && (
                    <p className={styles.description}>{selectedList.description}</p>
                  )}
                  {selectedList.refs.length > 0 && (
                    <button
                      className={styles.copyLinkButton}
                      onClick={handleCopyLink}
                      title="Kopier lenke til /tekst-visning"
                    >
                      Kopier lenke
                    </button>
                  )}
                </div>

                <div className={styles.addRefsSection}>
                  <label htmlFor="ref-input" className={styles.addLabel}>Legg til referanser</label>
                  <textarea
                    id="ref-input"
                    ref={refInputRef}
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleAddRefs();
                      }
                    }}
                    placeholder="F.eks. Joh 3:16, 1 Mos 1:1-5, Sal 23:1-6"
                    className={styles.refTextarea}
                    rows={2}
                  />
                  <div className={styles.addRefsActions}>
                    <button
                      onClick={handleAddRefs}
                      className={styles.addRefsButton}
                      disabled={refLoading || !refInput.trim()}
                    >
                      {refLoading ? 'Legger til...' : 'Legg til'}
                    </button>
                    <span className={styles.addHint}>Ctrl+Enter for å legge til</span>
                  </div>
                  {refError && <p className={styles.refError}>{refError}</p>}
                </div>

                {selectedList.refs.length === 0 ? (
                  <p className={styles.emptyList}>Ingen referanser i listen ennå.</p>
                ) : versesLoading ? (
                  <p className={styles.loading}>Laster vers...</p>
                ) : (
                  <div className={styles.verseList}>
                    {selectedList.refs.map((ref, index) => {
                      const refVerses = getVersesForRef(ref);
                      const parsed = parseRefString(ref);
                      const book = parsed ? books.find(b => toUrlSlug(b.short_name) === parsed.bookSlug) : null;
                      const contextUrl = parsed && book
                        ? `/${toUrlSlug(book.short_name)}/${parsed.chapter}#v${parsed.verseStart}`
                        : null;

                      return (
                        <div key={`${ref}-${index}`} className={styles.verseCard}>
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                              {contextUrl ? (
                                <Link to={contextUrl} className={styles.reference}>
                                  {getRefLabel(ref)}
                                </Link>
                              ) : (
                                <span className={styles.reference}>{getRefLabel(ref)}</span>
                              )}
                            </div>
                            <div className={styles.cardActions}>
                              <button
                                className={styles.moveButton}
                                onClick={() => handleMoveRef(index, 'up')}
                                disabled={index === 0}
                                title="Flytt opp"
                              >
                                ↑
                              </button>
                              <button
                                className={styles.moveButton}
                                onClick={() => handleMoveRef(index, 'down')}
                                disabled={index === selectedList.refs.length - 1}
                                title="Flytt ned"
                              >
                                ↓
                              </button>
                              <button
                                className={styles.removeButton}
                                onClick={() => handleRemoveRef(index)}
                                title="Fjern"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          {refVerses.length > 0 && (
                            <div className={styles.verseText}>
                              {refVerses.map((verseData, vi) => (
                                <VerseDisplay
                                  key={vi}
                                  verse={verseData.verse}
                                  bookId={verseData.verse.book_id}
                                  originalText={verseData.originalText || undefined}
                                  originalLanguage={verseData.originalLanguage}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className={styles.selectPrompt}>
                {lists.length === 0
                  ? 'Opprett en liste for å komme i gang.'
                  : 'Velg en liste for å se og redigere innholdet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
