

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getTopics, saveTopics, Topic, VerseTopic, migrateToIndexedDB } from '@/lib/offline/userData';

export type { Topic, VerseTopic };

interface TopicsContextType {
  topics: Topic[];
  verseTopics: VerseTopic[];
  addTopic: (name: string) => Topic;
  deleteTopic: (topicId: string) => void;
  renameTopic: (topicId: string, newName: string) => void;
  addTopicToVerse: (bookId: number, chapter: number, verse: number, topicId: string) => void;
  removeTopicFromVerse: (bookId: number, chapter: number, verse: number, topicId: string) => void;
  getTopicsForVerse: (bookId: number, chapter: number, verse: number) => Topic[];
  getVersesForTopic: (topicId: string) => VerseTopic[];
  searchTopics: (query: string) => Topic[];
}

const TopicsContext = createContext<TopicsContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [verseTopics, setVerseTopics] = useState<VerseTopic[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load topics on mount
  useEffect(() => {
    async function loadData() {
      await migrateToIndexedDB();
      const data = await getTopics();
      setTopics(data.topics);
      setVerseTopics(data.verseTopics);
      setLoaded(true);
    }
    loadData();
  }, []);

  // Save topics when they change
  useEffect(() => {
    if (loaded) {
      saveTopics({ topics, verseTopics });
    }
  }, [topics, verseTopics, loaded]);

  function addTopic(name: string): Topic {
    const trimmedName = name.trim();

    // Check if topic already exists (case-insensitive)
    const existing = topics.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      return existing;
    }

    const newTopic: Topic = {
      id: generateId(),
      name: trimmedName
    };
    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  }

  function deleteTopic(topicId: string) {
    setTopics(prev => prev.filter(t => t.id !== topicId));
    setVerseTopics(prev => prev.filter(vt => vt.topicId !== topicId));
  }

  function renameTopic(topicId: string, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, name: trimmedName } : t
    ));
  }

  function addTopicToVerse(bookId: number, chapter: number, verse: number, topicId: string) {
    // Check if already exists
    const exists = verseTopics.some(
      vt => vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse && vt.topicId === topicId
    );
    if (exists) return;

    setVerseTopics(prev => [...prev, { bookId, chapter, verse, topicId }]);
  }

  function removeTopicFromVerse(bookId: number, chapter: number, verse: number, topicId: string) {
    setVerseTopics(prev => prev.filter(
      vt => !(vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse && vt.topicId === topicId)
    ));
  }

  const getTopicsForVerse = useCallback((bookId: number, chapter: number, verse: number): Topic[] => {
    const topicIds = verseTopics
      .filter(vt => vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse)
      .map(vt => vt.topicId);

    return topics.filter(t => topicIds.includes(t.id));
  }, [topics, verseTopics]);

  const getVersesForTopic = useCallback((topicId: string): VerseTopic[] => {
    return verseTopics.filter(vt => vt.topicId === topicId);
  }, [verseTopics]);

  const searchTopics = useCallback((query: string): Topic[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return topics;

    return topics.filter(t => t.name.toLowerCase().includes(lowerQuery));
  }, [topics]);

  return (
    <TopicsContext.Provider value={{
      topics,
      verseTopics,
      addTopic,
      deleteTopic,
      renameTopic,
      addTopicToVerse,
      removeTopicFromVerse,
      getTopicsForVerse,
      getVersesForTopic,
      searchTopics
    }}>
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics() {
  const context = useContext(TopicsContext);
  if (!context) {
    throw new Error('useTopics must be used within TopicsProvider');
  }
  return context;
}
