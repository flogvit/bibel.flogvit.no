import { Link } from 'react-router-dom';
import { useTopics, Topic, ItemType } from '@/components/TopicsContext';
import { useNotes } from '@/components/NotesContext';
import { useEffect, useState } from 'react';
import styles from '@/styles/pages/topics.module.scss';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface VerseWithText {
  bookId: number;
  chapter: number;
  verse: number;
  bookName: string;
  bookShortName: string;
  text: string;
}

interface NoteWithInfo {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  content: string;
}

interface GenericItem {
  itemType: ItemType;
  itemId: string;
  title?: string;
  description?: string;
}

type FilterType = 'all' | ItemType;

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  verse: 'Vers',
  note: 'Notater',
  prophecy: 'Profetier',
  timeline: 'Tidslinje',
  person: 'Personer',
  readingplan: 'Leseplaner',
  theme: 'Temaer',
};

const ITEM_TYPE_BADGE_STYLES: Record<ItemType, string> = {
  verse: '',
  note: styles.noteBadge,
  prophecy: styles.prophecyBadge,
  timeline: styles.timelineBadge,
  person: styles.personBadge,
  readingplan: styles.readingplanBadge,
  theme: styles.themeBadge,
};

function getItemUrl(itemType: ItemType, itemId: string): string {
  switch (itemType) {
    case 'prophecy':
      return '/profetier';
    case 'timeline':
      return '/tidslinje';
    case 'person':
      return `/personer/${itemId}`;
    case 'readingplan':
      return '/leseplan';
    case 'theme':
      return `/temaer/${itemId}`;
    default:
      return '/';
  }
}

export function TopicsPage() {
  const { topics, verseTopics, itemTopics, deleteTopic, renameTopic, removeTopicFromVerse, removeTopicFromItem, getVersesForTopic, getItemsForTopic } = useTopics();
  const { notes } = useNotes();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [versesWithText, setVersesWithText] = useState<VerseWithText[]>([]);
  const [notesForTopic, setNotesForTopic] = useState<NoteWithInfo[]>([]);
  const [genericItems, setGenericItems] = useState<GenericItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

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
  }, [selectedTopic, verseTopics, getVersesForTopic]);

  // Load notes and generic items when a topic is selected
  useEffect(() => {
    if (!selectedTopic) {
      setNotesForTopic([]);
      setGenericItems([]);
      return;
    }

    // Get notes
    const noteItems = getItemsForTopic(selectedTopic.id, 'note');
    const noteIds = noteItems.map(it => it.itemId);
    const matchingNotes = notes.filter(n => noteIds.includes(n.id));
    setNotesForTopic(matchingNotes);

    // Get other item types (prophecy, timeline, person, readingplan, theme)
    const otherTypes: ItemType[] = ['prophecy', 'timeline', 'person', 'readingplan', 'theme'];
    const items: GenericItem[] = [];

    otherTypes.forEach(type => {
      const typeItems = getItemsForTopic(selectedTopic.id, type);
      typeItems.forEach(it => {
        items.push({
          itemType: type,
          itemId: it.itemId,
        });
      });
    });

    setGenericItems(items);
  }, [selectedTopic, itemTopics, notes, getItemsForTopic]);

  function handleDeleteTopic(topic: Topic) {
    if (confirm(`Er du sikker på at du vil slette emnet "${topic.name}"? Alle koblinger vil også bli fjernet.`)) {
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

  function handleRemoveNoteFromTopic(noteId: string) {
    if (selectedTopic) {
      removeTopicFromItem('note', noteId, selectedTopic.id);
    }
  }

  function handleRemoveGenericItem(itemType: ItemType, itemId: string) {
    if (selectedTopic) {
      removeTopicFromItem(itemType, itemId, selectedTopic.id);
    }
  }

  // Get item count for each topic
  function getItemCount(topicId: string): { total: number; byType: Record<string, number> } {
    const verseCount = verseTopics.filter(vt => vt.topicId === topicId).length;
    const byType: Record<string, number> = { verse: verseCount };

    // Count all item types
    itemTopics
      .filter(it => it.topicId === topicId)
      .forEach(it => {
        byType[it.itemType] = (byType[it.itemType] || 0) + 1;
      });

    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    return { total, byType };
  }

  // Get available filter types (only show types that have content)
  function getAvailableTypes(): ItemType[] {
    if (!selectedTopic) return [];

    const types = new Set<ItemType>();
    const verseCount = verseTopics.filter(vt => vt.topicId === selectedTopic.id).length;
    if (verseCount > 0) types.add('verse');

    itemTopics
      .filter(it => it.topicId === selectedTopic.id)
      .forEach(it => types.add(it.itemType));

    return Array.from(types);
  }

  // Check if should show item based on filter
  function shouldShow(type: ItemType): boolean {
    return filterType === 'all' || filterType === type;
  }

  const availableTypes = getAvailableTypes();
  const hasMultipleTypes = availableTypes.length > 1;
  const hasAnyContent = versesWithText.length > 0 || notesForTopic.length > 0 || genericItems.length > 0;

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
            Organiser bibelvers, notater, profetier, personer og mer etter emner.
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
              {topics.map(topic => {
                const counts = getItemCount(topic.id);
                return (
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
                        onClick={() => {
                          setSelectedTopic(selectedTopic?.id === topic.id ? null : topic);
                          setFilterType('all');
                        }}
                      >
                        <span className={styles.topicName}>{topic.name}</span>
                        <span className={styles.itemCount}>
                          {counts.total === 0 ? 'Ingen' :
                            Object.entries(counts.byType)
                              .filter(([, count]) => count > 0)
                              .map(([type, count]) => {
                                const label = ITEM_TYPE_LABELS[type as ItemType] || type;
                                return `${count} ${label.toLowerCase()}`;
                              })
                              .join(', ')
                          }
                        </span>
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
                );
              })}
            </div>

            <div className={styles.versePanel}>
              {selectedTopic ? (
                <>
                  <h2>{selectedTopic.name}</h2>

                  {/* Filter buttons */}
                  {hasMultipleTypes && (
                    <div className={styles.filterBar}>
                      <button
                        className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                        onClick={() => setFilterType('all')}
                      >
                        Alle
                      </button>
                      {availableTypes.map(type => (
                        <button
                          key={type}
                          className={`${styles.filterButton} ${filterType === type ? styles.active : ''}`}
                          onClick={() => setFilterType(type)}
                        >
                          {ITEM_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  )}

                  {loading ? (
                    <p className={styles.loading}>Laster...</p>
                  ) : !hasAnyContent ? (
                    <p className={styles.noVerses}>Ingen innhold i dette emnet ennå.</p>
                  ) : (
                    <div className={styles.verseList}>
                      {/* Verses */}
                      {shouldShow('verse') && versesWithText.map((verse, index) => (
                        <div key={`verse-${index}`} className={styles.verseCard}>
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitleRow}>
                              <span className={styles.itemTypeBadge}>Vers</span>
                              <Link
                                to={`/${verse.bookShortName.toLowerCase()}/${verse.chapter}#v${verse.verse}`}
                                className={styles.reference}
                              >
                                {verse.bookName} {verse.chapter}:{verse.verse}
                              </Link>
                            </div>
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

                      {/* Notes */}
                      {shouldShow('note') && notesForTopic.map((note) => (
                        <div key={`note-${note.id}`} className={`${styles.verseCard} ${styles.noteCard}`}>
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitleRow}>
                              <span className={`${styles.itemTypeBadge} ${styles.noteBadge}`}>Notat</span>
                            </div>
                            <button
                              className={styles.removeButton}
                              onClick={() => handleRemoveNoteFromTopic(note.id)}
                              title="Fjern fra emne"
                            >
                              ×
                            </button>
                          </div>
                          <p className={styles.text}>{note.content}</p>
                        </div>
                      ))}

                      {/* Generic items (prophecy, timeline, person, readingplan, theme) */}
                      {genericItems.filter(item => shouldShow(item.itemType)).map((item, index) => (
                        <div key={`${item.itemType}-${item.itemId}-${index}`} className={`${styles.verseCard} ${styles.genericCard}`}>
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitleRow}>
                              <span className={`${styles.itemTypeBadge} ${ITEM_TYPE_BADGE_STYLES[item.itemType]}`}>
                                {ITEM_TYPE_LABELS[item.itemType]}
                              </span>
                              <Link
                                to={getItemUrl(item.itemType, item.itemId)}
                                className={styles.reference}
                              >
                                {item.itemId}
                              </Link>
                            </div>
                            <button
                              className={styles.removeButton}
                              onClick={() => handleRemoveGenericItem(item.itemType, item.itemId)}
                              title="Fjern fra emne"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.selectPrompt}>Velg et emne for å se innholdet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
