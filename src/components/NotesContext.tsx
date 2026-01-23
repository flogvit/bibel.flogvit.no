'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'bible-notes';

export interface Note {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}

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

function loadNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Ignore storage errors
  }
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = loadNotes();
    setNotes(data);
    setLoaded(true);
  }, []);

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

  function getNotesForVerse(bookId: number, chapter: number, verse: number): Note[] {
    return notes.filter(
      note => note.bookId === bookId && note.chapter === chapter && note.verse === verse
    ).sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }

  function getNoteCount(): number {
    return notes.length;
  }

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
