

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getTopics,
  saveTopics,
  Topic,
  VerseTopic,
  ItemTopic,
  ItemType,
  getVerseItemId,
  parseVerseItemId,
  migrateToIndexedDB
} from '@/lib/offline/userData';
import { useSyncRefresh } from './SyncContext';

export type { Topic, VerseTopic, ItemTopic, ItemType };
export { getVerseItemId, parseVerseItemId };

interface TopicsContextType {
  topics: Topic[];
  verseTopics: VerseTopic[];
  itemTopics: ItemTopic[];

  // Grunnleggende topic-operasjoner
  addTopic: (name: string) => Topic;
  deleteTopic: (topicId: string) => void;
  renameTopic: (topicId: string, newName: string) => void;
  searchTopics: (query: string) => Topic[];

  // Generiske item-operasjoner (for alle typer innhold)
  addTopicToItem: (itemType: ItemType, itemId: string, topicId: string) => void;
  removeTopicFromItem: (itemType: ItemType, itemId: string, topicId: string) => void;
  getTopicsForItem: (itemType: ItemType, itemId: string) => Topic[];
  getItemsForTopic: (topicId: string, itemType?: ItemType) => ItemTopic[];

  // Legacy vers-operasjoner (for bakoverkompatibilitet)
  addTopicToVerse: (bookId: number, chapter: number, verse: number, topicId: string) => void;
  removeTopicFromVerse: (bookId: number, chapter: number, verse: number, topicId: string) => void;
  getTopicsForVerse: (bookId: number, chapter: number, verse: number) => Topic[];
  getVersesForTopic: (topicId: string) => VerseTopic[];
}

const TopicsContext = createContext<TopicsContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [verseTopics, setVerseTopics] = useState<VerseTopic[]>([]);
  const [itemTopics, setItemTopics] = useState<ItemTopic[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load topics on mount
  useEffect(() => {
    async function loadData() {
      await migrateToIndexedDB();
      const data = await getTopics();
      setTopics(data.topics);
      setVerseTopics(data.verseTopics);
      setItemTopics(data.itemTopics || []);
      setLoaded(true);
    }
    loadData();
  }, []);

  // Save topics when they change
  useEffect(() => {
    if (loaded) {
      saveTopics({ topics, verseTopics, itemTopics });
    }
  }, [topics, verseTopics, itemTopics, loaded]);

  // Refresh from storage after sync
  const refreshFromStorage = useCallback(async () => {
    const data = await getTopics();
    setTopics(data.topics);
    setVerseTopics(data.verseTopics);
    setItemTopics(data.itemTopics || []);
  }, []);
  useSyncRefresh(refreshFromStorage);

  // ============================================
  // Grunnleggende topic-operasjoner
  // ============================================

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
    setItemTopics(prev => prev.filter(it => it.topicId !== topicId));
  }

  function renameTopic(topicId: string, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, name: trimmedName } : t
    ));
  }

  const searchTopics = useCallback((query: string): Topic[] => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return topics;

    return topics.filter(t => t.name.toLowerCase().includes(lowerQuery));
  }, [topics]);

  // ============================================
  // Generiske item-operasjoner
  // ============================================

  function addTopicToItem(itemType: ItemType, itemId: string, topicId: string) {
    // Check if already exists
    const exists = itemTopics.some(
      it => it.itemType === itemType && it.itemId === itemId && it.topicId === topicId
    );
    if (exists) return;

    setItemTopics(prev => [...prev, { itemType, itemId, topicId }]);
  }

  function removeTopicFromItem(itemType: ItemType, itemId: string, topicId: string) {
    setItemTopics(prev => prev.filter(
      it => !(it.itemType === itemType && it.itemId === itemId && it.topicId === topicId)
    ));
  }

  const getTopicsForItem = useCallback((itemType: ItemType, itemId: string): Topic[] => {
    const topicIds = itemTopics
      .filter(it => it.itemType === itemType && it.itemId === itemId)
      .map(it => it.topicId);

    return topics.filter(t => topicIds.includes(t.id));
  }, [topics, itemTopics]);

  const getItemsForTopic = useCallback((topicId: string, itemType?: ItemType): ItemTopic[] => {
    if (itemType) {
      return itemTopics.filter(it => it.topicId === topicId && it.itemType === itemType);
    }
    return itemTopics.filter(it => it.topicId === topicId);
  }, [itemTopics]);

  // ============================================
  // Legacy vers-operasjoner (bakoverkompatibilitet)
  // ============================================

  function addTopicToVerse(bookId: number, chapter: number, verse: number, topicId: string) {
    // Bruk ny itemTopics-struktur
    const itemId = getVerseItemId(bookId, chapter, verse);
    addTopicToItem('verse', itemId, topicId);

    // Også oppdater legacy verseTopics for bakoverkompatibilitet
    const exists = verseTopics.some(
      vt => vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse && vt.topicId === topicId
    );
    if (!exists) {
      setVerseTopics(prev => [...prev, { bookId, chapter, verse, topicId }]);
    }
  }

  function removeTopicFromVerse(bookId: number, chapter: number, verse: number, topicId: string) {
    // Fjern fra ny itemTopics-struktur
    const itemId = getVerseItemId(bookId, chapter, verse);
    removeTopicFromItem('verse', itemId, topicId);

    // Også fjern fra legacy verseTopics
    setVerseTopics(prev => prev.filter(
      vt => !(vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse && vt.topicId === topicId)
    ));
  }

  const getTopicsForVerse = useCallback((bookId: number, chapter: number, verse: number): Topic[] => {
    // Prøv først nye itemTopics
    const itemId = getVerseItemId(bookId, chapter, verse);
    const fromItemTopics = getTopicsForItem('verse', itemId);

    if (fromItemTopics.length > 0) {
      return fromItemTopics;
    }

    // Fallback til legacy verseTopics
    const topicIds = verseTopics
      .filter(vt => vt.bookId === bookId && vt.chapter === chapter && vt.verse === verse)
      .map(vt => vt.topicId);

    return topics.filter(t => topicIds.includes(t.id));
  }, [topics, verseTopics, getTopicsForItem]);

  const getVersesForTopic = useCallback((topicId: string): VerseTopic[] => {
    // Kombiner fra begge kilder, fjern duplikater
    const fromItemTopics = itemTopics
      .filter(it => it.topicId === topicId && it.itemType === 'verse')
      .map(it => {
        const parsed = parseVerseItemId(it.itemId);
        if (!parsed) return null;
        return { ...parsed, topicId };
      })
      .filter((vt): vt is VerseTopic => vt !== null);

    const fromLegacy = verseTopics.filter(vt => vt.topicId === topicId);

    // Kombiner og fjern duplikater basert på bookId-chapter-verse
    const seen = new Set<string>();
    const combined: VerseTopic[] = [];

    for (const vt of [...fromItemTopics, ...fromLegacy]) {
      const key = `${vt.bookId}-${vt.chapter}-${vt.verse}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(vt);
      }
    }

    return combined;
  }, [verseTopics, itemTopics]);

  return (
    <TopicsContext.Provider value={{
      topics,
      verseTopics,
      itemTopics,
      addTopic,
      deleteTopic,
      renameTopic,
      searchTopics,
      addTopicToItem,
      removeTopicFromItem,
      getTopicsForItem,
      getItemsForTopic,
      addTopicToVerse,
      removeTopicFromVerse,
      getTopicsForVerse,
      getVersesForTopic
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
