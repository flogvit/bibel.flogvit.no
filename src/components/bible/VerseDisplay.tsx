'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './VerseDisplay.module.scss';
import type { Verse, Prophecy } from '@/lib/bible';
import { toUrlSlug } from '@/lib/url-utils';
import { useSettings } from '@/components/SettingsContext';
import { useFavorites } from '@/components/FavoritesContext';
import { useTopics, Topic } from '@/components/TopicsContext';
import { useNotes, Note } from '@/components/NotesContext';

interface VerseDisplayProps {
  verse: Verse;
  bookId: number;
  originalText?: string;
  originalLanguage: 'hebrew' | 'greek';
}

interface Word4WordData {
  word_index: number;
  word: string;
  original: string | null;
  pronunciation: string | null;
  explanation: string | null;
}

interface ReferenceData {
  to_book_id: number;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  description: string | null;
  book_short_name: string;
}

interface VerseExtras {
  prayer: string | null;
  sermon: string | null;
}

type TabType = 'original' | 'references' | 'prophecies' | 'prayer' | 'sermon' | 'topics' | 'notes';

export function VerseDisplay({ verse, bookId, originalText, originalLanguage }: VerseDisplayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { topics, addTopic, addTopicToVerse, removeTopicFromVerse, getTopicsForVerse, searchTopics } = useTopics();
  const { addNote, updateNote, deleteNote, getNotesForVerse } = useNotes();
  const [expanded, setExpanded] = useState(false);
  const favorited = isFavorite(bookId, verse.chapter, verse.verse);
  const verseTopics = getTopicsForVerse(bookId, verse.chapter, verse.verse);
  const verseNotes = getNotesForVerse(bookId, verse.chapter, verse.verse);
  const hasTopics = verseTopics.length > 0;
  const hasNotes = verseNotes.length > 0;

  // Check which bible version is being used
  const currentBible = searchParams.get('bible') || 'osnb1';
  // Word4word is only available for osnb1 currently
  const hasWord4Word = currentBible === 'osnb1';
  const [selectedWord, setSelectedWord] = useState<Word4WordData | null>(null);
  const [selectedOriginalWord, setSelectedOriginalWord] = useState<Word4WordData | null>(null);
  const [word4word, setWord4Word] = useState<Word4WordData[] | null>(null);
  const [originalWord4word, setOriginalWord4Word] = useState<Word4WordData[] | null>(null);
  const [references, setReferences] = useState<ReferenceData[] | null>(null);
  const [prophecies, setProphecies] = useState<Prophecy[] | null>(null);
  const [verseExtras, setVerseExtras] = useState<VerseExtras | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('original');
  const [loading, setLoading] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');

  // Auto-expand if URL hash matches this verse with -open suffix
  useEffect(() => {
    const hash = window.location.hash;
    const verseMatch = hash.match(/^#v(\d+)-open(?:-w(\d+))?$/);
    if (verseMatch && parseInt(verseMatch[1]) === verse.verse) {
      setExpanded(true);
      loadData().then(data => {
        // If there's a word index in the hash, select that word
        if (verseMatch[2] && hasWord4Word) {
          const wordIndex = parseInt(verseMatch[2]);
          const wordData = data.find(w => w.word_index === wordIndex);
          if (wordData && wordData.original) {
            setSelectedWord(wordData);
          }
        }
      });
    }
  }, [verse.verse]);

  // Listen for other verses opening and close this one
  useEffect(() => {
    function handleVerseOpen(e: CustomEvent<number>) {
      if (e.detail !== verse.verse && expanded) {
        setExpanded(false);
        setSelectedWord(null);
      }
    }
    window.addEventListener('verse-opened', handleVerseOpen as EventListener);
    return () => window.removeEventListener('verse-opened', handleVerseOpen as EventListener);
  }, [verse.verse, expanded]);

  const words = verse.text.split(/\s+/);

  async function loadData(): Promise<Word4WordData[]> {
    if (word4word !== null) return word4word;

    setLoading(true);
    try {
      // Only fetch Norwegian word4word if we have data for this bible version
      const fetches: Promise<Response>[] = [
        fetch(`/api/word4word?bookId=${bookId}&chapter=${verse.chapter}&verse=${verse.verse}&bible=original`),
        fetch(`/api/references?bookId=${bookId}&chapter=${verse.chapter}&verse=${verse.verse}`),
        fetch(`/api/prophecies?book=${bookId}&chapter=${verse.chapter}&verse=${verse.verse}`),
        fetch(`/api/verse-extras?bookId=${bookId}&chapter=${verse.chapter}&verse=${verse.verse}`)
      ];

      if (hasWord4Word) {
        fetches.unshift(fetch(`/api/word4word?bookId=${bookId}&chapter=${verse.chapter}&verse=${verse.verse}`));
      }

      const responses = await Promise.all(fetches);

      let w4wData: Word4WordData[] = [];
      let responseIndex = 0;

      if (hasWord4Word) {
        w4wData = await responses[responseIndex++].json();
      }

      const origW4wData = await responses[responseIndex++].json();
      const refsData = await responses[responseIndex++].json();
      const propheciesData = await responses[responseIndex++].json();
      const extrasData = await responses[responseIndex++].json();

      setWord4Word(w4wData);
      setOriginalWord4Word(origW4wData);
      setReferences(refsData);
      setProphecies(propheciesData.prophecies || []);
      setVerseExtras(extrasData);
      setLoading(false);
      return w4wData;
    } catch (error) {
      console.error('Failed to load verse data:', error);
      setLoading(false);
      return [];
    }
  }

  function handleVerseClick() {
    const newExpanded = !expanded;
    if (newExpanded) {
      loadData();
      // Update URL hash to remember this verse is open
      window.history.replaceState(null, '', `#v${verse.verse}-open`);
      // Notify other verses to close
      window.dispatchEvent(new CustomEvent('verse-opened', { detail: verse.verse }));
    } else {
      // Clear the hash when closing
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setExpanded(newExpanded);
    setSelectedWord(null);
  }

  async function handleWordClick(wordIndex: number) {
    const data = await loadData();
    const wordData = data.find(w => w.word_index === wordIndex + 1);
    if (wordData && wordData.original) {
      const isDeselecting = selectedWord?.word_index === wordData.word_index;
      setSelectedWord(isDeselecting ? null : wordData);
      // Update URL hash with word index
      if (isDeselecting) {
        window.history.replaceState(null, '', `#v${verse.verse}-open`);
      } else {
        window.history.replaceState(null, '', `#v${verse.verse}-open-w${wordData.word_index}`);
      }
    }
  }

  function formatReference(ref: ReferenceData): string {
    const verseRange = ref.to_verse_start === ref.to_verse_end
      ? `${ref.to_verse_start}`
      : `${ref.to_verse_start}-${ref.to_verse_end}`;
    return `${ref.book_short_name} ${ref.to_chapter}:${verseRange}`;
  }

  function handleFavoriteClick() {
    toggleFavorite({ bookId, chapter: verse.chapter, verse: verse.verse });
  }

  function getTopicSuggestions(): Topic[] {
    // Get existing topic IDs for this verse to filter them out
    const existingTopicIds = verseTopics.map(t => t.id);

    // If no input, show all available topics (not already on this verse)
    if (!topicInput.trim()) {
      return topics
        .filter(t => !existingTopicIds.includes(t.id))
        .slice(0, 8);
    }

    // Otherwise filter by search
    return searchTopics(topicInput)
      .filter(t => !existingTopicIds.includes(t.id))
      .slice(0, 8);
  }

  function handleAddTopic(existingTopic: Topic | null) {
    const trimmedInput = topicInput.trim();
    if (!trimmedInput && !existingTopic) return;

    let topic: Topic;
    if (existingTopic) {
      topic = existingTopic;
    } else {
      topic = addTopic(trimmedInput);
    }

    addTopicToVerse(bookId, verse.chapter, verse.verse, topic.id);
    setTopicInput('');
    setShowTopicSuggestions(false);
    setSelectedSuggestionIndex(0);
  }

  return (
    <div id={`v${verse.verse}`} className={styles.verse}>
      <span
        className={styles.verseNumber}
        onClick={handleVerseClick}
        title="Klikk for å se original tekst og referanser"
      >
        {favorited && <span className={styles.favoriteIndicator}>★</span>}
        {hasTopics && <span className={styles.topicIndicator} title={`${verseTopics.length} emne${verseTopics.length > 1 ? 'r' : ''}`} />}
        {hasNotes && <span className={styles.noteIndicator} title={`${verseNotes.length} notat${verseNotes.length > 1 ? 'er' : ''}`} />}
        {verse.verse}
      </span>

      <span className={styles.verseText}>
        {words.map((word, index) => {
          const wordData = word4word?.find(w => w.word_index === index + 1);
          const isSelected = selectedWord?.word_index === index + 1;
          // Make word clickable if setting is enabled and we have word4word for this bible
          // Data will be loaded on click if not already loaded
          const isClickable = settings.showWord4Word && hasWord4Word;

          return (
            <span key={index}>
              {isClickable ? (
                <span
                  className={`${styles.word} ${styles.clickable} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleWordClick(index)}
                  title="Klikk for ordforklaring"
                >
                  {word}
                </span>
              ) : (
                <span className={styles.word}>{word}</span>
              )}
              {' '}
            </span>
          );
        })}
      </span>

      {settings.showWord4Word && selectedWord && selectedWord.original && (
        <div className={styles.wordDetail}>
          <span className={styles.original}>{selectedWord.original}</span>
          {selectedWord.pronunciation && (
            <span className={styles.pronunciation}>{selectedWord.pronunciation}</span>
          )}
          {selectedWord.explanation && (
            <p className={styles.explanation}>{selectedWord.explanation}</p>
          )}
          <button
            className={styles.searchOriginalButton}
            onClick={() => router.push(`/sok/original?word=${encodeURIComponent(selectedWord.original!)}`)}
          >
            Søk alle forekomster
          </button>
        </div>
      )}

      {settings.showOriginalText && originalText && (
        <div
          className={`${styles.originalVerse} ${originalLanguage === 'hebrew' ? styles.hebrew : styles.greek}`}
          dir={originalLanguage === 'hebrew' ? 'rtl' : 'ltr'}
        >
          {originalText}
        </div>
      )}

      {expanded && (
        <div className={styles.expanded}>
          {loading ? (
            <p className={styles.loading}>Laster...</p>
          ) : (
            <>
              <div className={styles.expandedHeader}>
                <button
                  className={`${styles.favoriteToggle} ${favorited ? styles.favorited : ''}`}
                  onClick={handleFavoriteClick}
                >
                  {favorited ? '★ Fjern favoritt' : '☆ Legg til favoritt'}
                </button>
              </div>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'original' ? styles.active : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  Grunntekst
                </button>
                {settings.showReferences && (
                  <button
                    className={`${styles.tab} ${activeTab === 'references' ? styles.active : ''}`}
                    onClick={() => setActiveTab('references')}
                  >
                    Referanser
                  </button>
                )}
                {prophecies && prophecies.length > 0 && (
                  <button
                    className={`${styles.tab} ${activeTab === 'prophecies' ? styles.active : ''}`}
                    onClick={() => setActiveTab('prophecies')}
                  >
                    Profetier ({prophecies.length})
                  </button>
                )}
                {verseExtras?.prayer && (
                  <button
                    className={`${styles.tab} ${activeTab === 'prayer' ? styles.active : ''}`}
                    onClick={() => setActiveTab('prayer')}
                  >
                    Bønn
                  </button>
                )}
                {verseExtras?.sermon && (
                  <button
                    className={`${styles.tab} ${activeTab === 'sermon' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sermon')}
                  >
                    Andakt
                  </button>
                )}
                <button
                  className={`${styles.tab} ${activeTab === 'topics' ? styles.active : ''}`}
                  onClick={() => setActiveTab('topics')}
                >
                  Emner {verseTopics.length > 0 && `(${verseTopics.length})`}
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'notes' ? styles.active : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notater {verseNotes.length > 0 && `(${verseNotes.length})`}
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'original' && (
                  <div className={styles.originalTextTab}>
                    {originalText && (
                      <div
                        className={`${styles.fullOriginalText} ${originalLanguage === 'hebrew' ? styles.hebrew : styles.greek}`}
                        dir={originalLanguage === 'hebrew' ? 'rtl' : 'ltr'}
                      >
                        {originalText}
                      </div>
                    )}

                    {/* Word-for-word from original text (Hebrew/Greek) */}
                    {originalWord4word && originalWord4word.length > 0 && (
                      <>
                        <h5 className={styles.sectionTitle}>Ord for ord</h5>
                        <div
                          className={`${styles.originalText} ${originalLanguage === 'hebrew' ? styles.hebrewWords : ''}`}
                          dir={originalLanguage === 'hebrew' ? 'rtl' : 'ltr'}
                        >
                          {originalWord4word.map(w => (
                            <span
                              key={w.word_index}
                              className={`${styles.originalWord} ${styles.clickableWord} ${selectedOriginalWord?.word_index === w.word_index ? styles.selectedWord : ''}`}
                              onClick={() => setSelectedOriginalWord(selectedOriginalWord?.word_index === w.word_index ? null : w)}
                            >
                              <span className={styles.originalScript}>{w.word}</span>
                              {w.pronunciation && (
                                <span className={styles.translatedWord}>{w.pronunciation}</span>
                              )}
                            </span>
                          ))}
                        </div>

                        {selectedOriginalWord && (
                          <div className={styles.wordExplanation}>
                            <strong>{selectedOriginalWord.word}</strong>
                            {selectedOriginalWord.pronunciation && (
                              <span className={styles.pronunciationInline}> ({selectedOriginalWord.pronunciation})</span>
                            )}
                            {selectedOriginalWord.explanation && (
                              <p>{selectedOriginalWord.explanation}</p>
                            )}
                            <button
                              className={styles.searchOriginalButton}
                              onClick={() => router.push(`/sok/original?word=${encodeURIComponent(selectedOriginalWord.word)}`)}
                            >
                              Søk alle forekomster
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Mapping from Norwegian to original (existing word4word) - only for osnb1 */}
                    {hasWord4Word && word4word && word4word.filter(w => w.original).length > 0 && (
                      <>
                        <h5 className={styles.sectionTitle}>Norsk → Grunntekst</h5>
                        <div className={styles.originalText}>
                          {word4word.filter(w => w.original).map(w => (
                            <span key={w.word_index} className={styles.originalWord}>
                              <span className={styles.originalScript}>{w.original}</span>
                              <span className={styles.translatedWord}>{w.word}</span>
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {(!originalWord4word || originalWord4word.length === 0) && (!hasWord4Word || !word4word || word4word.filter(w => w.original).length === 0) && (
                      <p className="text-muted">Ingen orddata tilgjengelig</p>
                    )}
                  </div>
                )}

                {settings.showReferences && activeTab === 'references' && (
                  <div className={styles.referencesList}>
                    {references && references.length > 0 ? (
                      references.map((ref, index) => (
                        <a
                          key={index}
                          href={`/${toUrlSlug(ref.book_short_name)}/${ref.to_chapter}#v${ref.to_verse_start}`}
                          className={styles.reference}
                        >
                          <span className={styles.refLink}>{formatReference(ref)}</span>
                          {ref.description && (
                            <span className={styles.refDescription}>{ref.description}</span>
                          )}
                        </a>
                      ))
                    ) : (
                      <p className="text-muted">Ingen referanser</p>
                    )}
                  </div>
                )}

                {activeTab === 'prophecies' && prophecies && prophecies.length > 0 && (
                  <div className={styles.propheciesList}>
                    {prophecies.map((prophecy) => (
                      <a
                        key={prophecy.id}
                        href={`/profetier#${prophecy.id}`}
                        className={styles.prophecyItem}
                      >
                        <span className={styles.prophecyTitle}>{prophecy.title}</span>
                        <span className={styles.prophecyCategory}>{prophecy.category?.name}</span>
                        {prophecy.explanation && (
                          <p className={styles.prophecyExplanation}>{prophecy.explanation}</p>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {activeTab === 'prayer' && verseExtras?.prayer && (
                  <div className={styles.prayerContent}>
                    <p>{verseExtras.prayer}</p>
                  </div>
                )}

                {activeTab === 'sermon' && verseExtras?.sermon && (
                  <div className={styles.sermonContent}>
                    <p>{verseExtras.sermon}</p>
                  </div>
                )}

                {activeTab === 'topics' && (
                  <div className={styles.topicsContent}>
                    {verseTopics.length > 0 ? (
                      <div className={styles.topicsList}>
                        {verseTopics.map(topic => (
                          <span key={topic.id} className={styles.topicTag}>
                            {topic.name}
                            <button
                              className={styles.topicRemove}
                              onClick={() => removeTopicFromVerse(bookId, verse.chapter, verse.verse, topic.id)}
                              title="Fjern emne"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noTopics}>Ingen emner lagt til ennå</p>
                    )}

                    <div className={styles.topicInputWrapper}>
                      <input
                        type="text"
                        className={styles.topicInput}
                        placeholder="Legg til emne..."
                        value={topicInput}
                        onChange={(e) => {
                          setTopicInput(e.target.value);
                          setShowTopicSuggestions(true);
                          setSelectedSuggestionIndex(0);
                        }}
                        onFocus={() => setShowTopicSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 150)}
                        onKeyDown={(e) => {
                          const suggestions = getTopicSuggestions();
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === 'Enter' && topicInput.trim()) {
                            e.preventDefault();
                            if (suggestions.length > 0 && selectedSuggestionIndex < suggestions.length) {
                              handleAddTopic(suggestions[selectedSuggestionIndex]);
                            } else {
                              handleAddTopic(null);
                            }
                          } else if (e.key === 'Escape') {
                            setShowTopicSuggestions(false);
                          }
                        }}
                      />
                      {showTopicSuggestions && (getTopicSuggestions().length > 0 || topicInput.trim()) && (
                        <div className={styles.topicSuggestions}>
                          {getTopicSuggestions().map((topic, index) => (
                            <div
                              key={topic.id}
                              className={`${styles.topicSuggestion} ${index === selectedSuggestionIndex ? styles.selected : ''}`}
                              onClick={() => handleAddTopic(topic)}
                            >
                              {topic.name}
                            </div>
                          ))}
                          {topicInput.trim() && !topics.some(t => t.name.toLowerCase() === topicInput.trim().toLowerCase()) && (
                            <div
                              className={`${styles.topicSuggestion} ${getTopicSuggestions().length === selectedSuggestionIndex ? styles.selected : ''}`}
                              onClick={() => handleAddTopic(null)}
                            >
                              {topicInput.trim()}
                              <span className={styles.topicNewLabel}>(nytt emne)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className={styles.notesContent}>
                    {verseNotes.length > 0 && (
                      <div className={styles.notesList}>
                        {verseNotes.map(note => (
                          <div key={note.id} className={styles.noteItem}>
                            {editingNoteId === note.id ? (
                              <div className={styles.noteEditForm}>
                                <textarea
                                  className={styles.noteTextarea}
                                  value={editNoteContent}
                                  onChange={(e) => setEditNoteContent(e.target.value)}
                                  rows={4}
                                  autoFocus
                                />
                                <div className={styles.noteActions}>
                                  <button
                                    className={styles.noteSaveButton}
                                    onClick={() => {
                                      if (editNoteContent.trim()) {
                                        updateNote(note.id, editNoteContent);
                                      }
                                      setEditingNoteId(null);
                                      setEditNoteContent('');
                                    }}
                                  >
                                    Lagre
                                  </button>
                                  <button
                                    className={styles.noteCancelButton}
                                    onClick={() => {
                                      setEditingNoteId(null);
                                      setEditNoteContent('');
                                    }}
                                  >
                                    Avbryt
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={styles.noteText}>{note.content}</p>
                                <div className={styles.noteFooter}>
                                  <span className={styles.noteDate}>
                                    {new Date(note.updatedAt).toLocaleDateString('nb-NO', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <div className={styles.noteActions}>
                                    <button
                                      className={styles.noteEditButton}
                                      onClick={() => {
                                        setEditingNoteId(note.id);
                                        setEditNoteContent(note.content);
                                      }}
                                      title="Rediger"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      className={styles.noteDeleteButton}
                                      onClick={() => {
                                        if (confirm('Er du sikker på at du vil slette dette notatet?')) {
                                          deleteNote(note.id);
                                        }
                                      }}
                                      title="Slett"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.noteInputWrapper}>
                      <textarea
                        className={styles.noteTextarea}
                        placeholder="Skriv et notat..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        rows={3}
                      />
                      <button
                        className={styles.noteAddButton}
                        onClick={() => {
                          if (noteInput.trim()) {
                            addNote(bookId, verse.chapter, verse.verse, noteInput);
                            setNoteInput('');
                          }
                        }}
                        disabled={!noteInput.trim()}
                      >
                        Legg til notat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
