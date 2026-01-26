

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getNotes, saveNotes, Note, migrateToIndexedDB } from '@/lib/offline/userData';

export type { Note };

interface NotesContextType {
  notes: Note[];
  addNote: (bookId: number, chapter: number, verse: number, content: string) => Note;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  getNotesForVerse: (bookId: number, chapter: number, verse: number) => Note[];
  getNoteCount: () => number;
}

const NotesContext = createContext<NotesContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load notes on mount
  useEffect(() => {
    async function loadData() {
      await migrateToIndexedDB();
      const data = await getNotes();
      setNotes(data);
      setLoaded(true);
    }
    loadData();
  }, []);

  // Save notes when they change
  useEffect(() => {
    if (loaded) {
      saveNotes(notes);
    }
  }, [notes, loaded]);

  function addNote(bookId: number, chapter: number, verse: number, content: string): Note {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Note content cannot be empty');
    }

    const now = Date.now();
    const newNote: Note = {
      id: generateId(),
      bookId,
      chapter,
      verse,
      content: trimmedContent,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }

  function updateNote(id: string, content: string) {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, content: trimmedContent, updatedAt: Date.now() }
        : note
    ));
  }

  function deleteNote(id: string) {
    setNotes(prev => prev.filter(note => note.id !== id));
  }

  const getNotesForVerse = useCallback((bookId: number, chapter: number, verse: number): Note[] => {
    return notes.filter(
      note => note.bookId === bookId && note.chapter === chapter && note.verse === verse
    ).sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }, [notes]);

  const getNoteCount = useCallback((): number => {
    return notes.length;
  }, [notes]);

  return (
    <NotesContext.Provider value={{
      notes,
      addNote,
      updateNote,
      deleteNote,
      getNotesForVerse,
      getNoteCount,
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
