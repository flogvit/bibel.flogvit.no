'use client';

import Link from 'next/link';
import { useNotes, Note } from '@/components/NotesContext';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';

interface VerseWithText {
  bookId: number;
  chapter: number;
  verse: number;
  bookName: string;
  bookShortName: string;
  text: string;
}

interface NoteWithVerse extends Note {
  bookName?: string;
  bookShortName?: string;
  verseText?: string;
}

interface GroupedNotes {
  bookId: number;
  bookName: string;
  bookShortName: string;
  chapters: {
    chapter: number;
    notes: NoteWithVerse[];
  }[];
}

export default function NotesPage() {
  const { notes, updateNote, deleteNote } = useNotes();
  const [notesWithText, setNotesWithText] = useState<NoteWithVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadVerseTexts() {
      if (notes.length === 0) {
        setNotesWithText([]);
        setLoading(false);
        return;
      }

      try {
        const favorites = notes.map(note => ({
          bookId: note.bookId,
          chapter: note.chapter,
          verse: note.verse
        }));

        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites }),
        });
        const verseData: VerseWithText[] = await response.json();

        const enrichedNotes = notes.map(note => {
          const verse = verseData.find(
            v => v.bookId === note.bookId && v.chapter === note.chapter && v.verse === note.verse
          );
          return {
            ...note,
            bookName: verse?.bookName,
            bookShortName: verse?.bookShortName,
            verseText: verse?.text,
          };
        });

        setNotesWithText(enrichedNotes);
      } catch (error) {
        console.error('Failed to load verse texts:', error);
        setNotesWithText(notes);
      }
      setLoading(false);
    }

    loadVerseTexts();
  }, [notes]);

  function getGroupedNotes(): GroupedNotes[] {
    const filtered = searchQuery
      ? notesWithText.filter(note =>
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.bookName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : notesWithText;

    const grouped: Record<number, GroupedNotes> = {};

    filtered.forEach(note => {
      if (!grouped[note.bookId]) {
        grouped[note.bookId] = {
          bookId: note.bookId,
          bookName: note.bookName || `Bok ${note.bookId}`,
          bookShortName: note.bookShortName || '',
          chapters: [],
        };
      }

      const book = grouped[note.bookId];
      let chapter = book.chapters.find(c => c.chapter === note.chapter);
      if (!chapter) {
        chapter = { chapter: note.chapter, notes: [] };
        book.chapters.push(chapter);
      }
      chapter.notes.push(note);
    });

    // Sort by book ID, chapters, and notes by verse
    return Object.values(grouped)
      .sort((a, b) => a.bookId - b.bookId)
      .map(book => ({
        ...book,
        chapters: book.chapters
          .sort((a, b) => a.chapter - b.chapter)
          .map(chapter => ({
            ...chapter,
            notes: chapter.notes.sort((a, b) => a.verse - b.verse),
          })),
      }));
  }

  function handleDeleteNote(note: NoteWithVerse) {
    if (confirm('Er du sikker på at du vil slette dette notatet?')) {
      deleteNote(note.id);
    }
  }

  function handleStartEdit(note: NoteWithVerse) {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  }

  function handleSaveEdit() {
    if (editingNoteId && editContent.trim()) {
      updateNote(editingNoteId, editContent.trim());
    }
    setEditingNoteId(null);
    setEditContent('');
  }

  const groupedNotes = getGroupedNotes();
  const totalNotes = notesWithText.length;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>← Tilbake</Link>
          <h1>Mine notater</h1>
          <p className={styles.intro}>
            Dine personlige studienotater. Klikk på et vers og velg &quot;Notater&quot;-fanen for å legge til nye notater.
          </p>
        </header>

        {loading ? (
          <div className={styles.loading}>Laster notater...</div>
        ) : totalNotes === 0 ? (
          <div className={styles.empty}>
            <p>Du har ingen notater ennå.</p>
            <p>Åpne et vers og gå til &quot;Notater&quot;-fanen for å komme i gang.</p>
          </div>
        ) : (
          <>
            <div className={styles.toolbar}>
              <span className={styles.noteCount}>{totalNotes} notat{totalNotes !== 1 ? 'er' : ''}</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Søk i notater..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {groupedNotes.length === 0 ? (
              <p className={styles.noResults}>Ingen notater funnet for &quot;{searchQuery}&quot;</p>
            ) : (
              <div className={styles.notesList}>
                {groupedNotes.map(book => (
                  <div key={book.bookId} className={styles.bookSection}>
                    <h2 className={styles.bookTitle}>{book.bookName}</h2>
                    {book.chapters.map(chapter => (
                      <div key={chapter.chapter} className={styles.chapterSection}>
                        <h3 className={styles.chapterTitle}>Kapittel {chapter.chapter}</h3>
                        <div className={styles.chapterNotes}>
                          {chapter.notes.map(note => (
                            <div key={note.id} className={styles.noteCard}>
                              <div className={styles.noteHeader}>
                                <Link
                                  href={`/${book.bookShortName.toLowerCase()}/${note.chapter}#v${note.verse}`}
                                  className={styles.reference}
                                >
                                  {book.bookName} {note.chapter}:{note.verse}
                                </Link>
                                <div className={styles.noteActions}>
                                  <button
                                    className={styles.editButton}
                                    onClick={() => handleStartEdit(note)}
                                    title="Rediger"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDeleteNote(note)}
                                    title="Slett"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              {note.verseText && (
                                <p className={styles.verseText}>{note.verseText}</p>
                              )}

                              {editingNoteId === note.id ? (
                                <div className={styles.editForm}>
                                  <textarea
                                    className={styles.editTextarea}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={4}
                                    autoFocus
                                  />
                                  <div className={styles.editActions}>
                                    <button className={styles.saveButton} onClick={handleSaveEdit}>
                                      Lagre
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={() => setEditingNoteId(null)}
                                    >
                                      Avbryt
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.noteContent}>
                                  <p className={styles.noteText}>{note.content}</p>
                                  <span className={styles.noteDate}>
                                    {new Date(note.updatedAt).toLocaleDateString('nb-NO', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
