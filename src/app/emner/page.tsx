'use client';

import Link from 'next/link';
import { useTopics, Topic } from '@/components/TopicsContext';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface VerseWithText {
  bookId: number;
  chapter: number;
  verse: number;
  bookName: string;
  bookShortName: string;
  text: string;
}

export default function TopicsPage() {
  const { topics, verseTopics, deleteTopic, renameTopic, removeTopicFromVerse, getVersesForTopic } = useTopics();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [versesWithText, setVersesWithText] = useState<VerseWithText[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load verses when a topic is selected
  useEffect(() => {
    async function loadVerseTexts() {
      if (!selectedTopic) {
        setVersesWithText([]);
        return;
      }

      const topicVerses = getVersesForTopic(selectedTopic.id);
      if (topicVerses.length === 0) {
        setVersesWithText([]);
        return;
      }

      setLoading(true);
      try {
        // Reuse the favorites API to get verse texts
        const favorites = topicVerses.map(vt => ({
          bookId: vt.bookId,
          chapter: vt.chapter,
          verse: vt.verse
        }));

        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites }),
        });
        const data = await response.json();
        setVersesWithText(data);
      } catch (error) {
        console.error('Failed to load verses:', error);
      }
      setLoading(false);
    }

    loadVerseTexts();
  }, [selectedTopic, verseTopics]);

  function handleDeleteTopic(topic: Topic) {
    if (confirm(`Er du sikker på at du vil slette emnet "${topic.name}"? Alle vers-koblinger vil også bli fjernet.`)) {
      deleteTopic(topic.id);
      if (selectedTopic?.id === topic.id) {
        setSelectedTopic(null);
      }
    }
  }

  function handleStartEdit(topic: Topic) {
    setEditingTopic(topic.id);
    setEditName(topic.name);
  }

  function handleSaveEdit() {
    if (editingTopic && editName.trim()) {
      renameTopic(editingTopic, editName.trim());
    }
    setEditingTopic(null);
    setEditName('');
  }

  function handleRemoveVerseFromTopic(verse: VerseWithText) {
    if (selectedTopic) {
      removeTopicFromVerse(verse.bookId, verse.chapter, verse.verse, selectedTopic.id);
    }
  }

  // Get verse count for each topic
  function getVerseCount(topicId: string): number {
    return verseTopics.filter(vt => vt.topicId === topicId).length;
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <Breadcrumbs items={[
          { label: 'Hjem', href: '/' },
          { label: 'Emner' }
        ]} />
        <header className={styles.header}>
          <h1>Mine emner</h1>
          <p className={styles.intro}>
            Organiser bibelvers etter emner. Åpne et vers og gå til &quot;Emner&quot;-fanen for å legge til emner.
          </p>
        </header>

        {topics.length === 0 ? (
          <div className={styles.empty}>
            <p>Du har ingen emner ennå.</p>
            <p>Åpne et vers og gå til &quot;Emner&quot;-fanen for å komme i gang.</p>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.topicList}>
              <h2>Emner ({topics.length})</h2>
              {topics.map(topic => (
                <div
                  key={topic.id}
                  className={`${styles.topicItem} ${selectedTopic?.id === topic.id ? styles.selected : ''}`}
                >
                  {editingTopic === topic.id ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingTopic(null);
                        }}
                        autoFocus
                        aria-label="Rediger emnenavn"
                      />
                      <button onClick={handleSaveEdit} className={styles.saveButton}>Lagre</button>
                      <button onClick={() => setEditingTopic(null)} className={styles.cancelButton}>Avbryt</button>
                    </div>
                  ) : (
                    <>
                      <button
                        className={styles.topicButton}
                        onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                      >
                        <span className={styles.topicName}>{topic.name}</span>
                        <span className={styles.verseCount}>{getVerseCount(topic.id)} vers</span>
                      </button>
                      <div className={styles.topicActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleStartEdit(topic)}
                          title="Rediger navn"
                        >
                          ✎
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteTopic(topic)}
                          title="Slett emne"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.versePanel}>
              {selectedTopic ? (
                <>
                  <h2>{selectedTopic.name}</h2>
                  {loading ? (
                    <p className={styles.loading}>Laster vers...</p>
                  ) : versesWithText.length === 0 ? (
                    <p className={styles.noVerses}>Ingen vers i dette emnet ennå.</p>
                  ) : (
                    <div className={styles.verseList}>
                      {versesWithText.map((verse, index) => (
                        <div key={index} className={styles.verseCard}>
                          <div className={styles.cardHeader}>
                            <Link
                              href={`/${verse.bookShortName.toLowerCase()}/${verse.chapter}#v${verse.verse}`}
                              className={styles.reference}
                            >
                              {verse.bookName} {verse.chapter}:{verse.verse}
                            </Link>
                            <button
                              className={styles.removeButton}
                              onClick={() => handleRemoveVerseFromTopic(verse)}
                              title="Fjern fra emne"
                            >
                              ×
                            </button>
                          </div>
                          <p className={styles.text}>{verse.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.selectPrompt}>Velg et emne for å se versene</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
