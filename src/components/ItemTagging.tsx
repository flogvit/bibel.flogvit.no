import { useState } from 'react';
import { useTopics, Topic, ItemType } from '@/components/TopicsContext';
import styles from './ItemTagging.module.scss';

interface ItemTaggingProps {
  itemType: ItemType;
  itemId: string;
  compact?: boolean;  // For inline visning i kort
  className?: string;
}

export function ItemTagging({ itemType, itemId, compact = false, className }: ItemTaggingProps) {
  const { topics, addTopic, addTopicToItem, removeTopicFromItem, getTopicsForItem, searchTopics } = useTopics();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const itemTopics = getTopicsForItem(itemType, itemId);

  function getSuggestions(): Topic[] {
    const existingIds = itemTopics.map(t => t.id);

    if (!input.trim()) {
      return topics
        .filter(t => !existingIds.includes(t.id))
        .slice(0, 8);
    }

    return searchTopics(input)
      .filter(t => !existingIds.includes(t.id))
      .slice(0, 8);
  }

  function handleAddTopic(existingTopic: Topic | null) {
    const trimmedInput = input.trim();
    if (!trimmedInput && !existingTopic) return;

    let topic: Topic;
    if (existingTopic) {
      topic = existingTopic;
    } else {
      topic = addTopic(trimmedInput);
    }

    addTopicToItem(itemType, itemId, topic.id);
    setInput('');
    setShowSuggestions(false);
  }

  function handleRemoveTopic(topicId: string) {
    removeTopicFromItem(itemType, itemId, topicId);
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  }

  const suggestions = getSuggestions();

  if (compact) {
    return (
      <div className={`${styles.compactContainer} ${className || ''}`} onClick={e => e.stopPropagation()}>
        <button
          className={`${styles.tagButton} ${itemTopics.length > 0 ? styles.hasTags : ''}`}
          onClick={handleToggle}
          title={itemTopics.length > 0 ? `${itemTopics.length} emne${itemTopics.length > 1 ? 'r' : ''}` : 'Legg til emne'}
        >
          <span className={styles.tagIcon}>🏷</span>
          {itemTopics.length > 0 && <span className={styles.tagCount}>{itemTopics.length}</span>}
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {itemTopics.length > 0 && (
              <div className={styles.tagsList}>
                {itemTopics.map(topic => (
                  <span key={topic.id} className={styles.tag}>
                    {topic.name}
                    <button
                      className={styles.removeTag}
                      onClick={() => handleRemoveTopic(topic.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                placeholder="Legg til emne..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim()) {
                    e.preventDefault();
                    if (suggestions.length > 0) {
                      handleAddTopic(suggestions[0]);
                    } else {
                      handleAddTopic(null);
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                autoFocus
              />
              {showSuggestions && (suggestions.length > 0 || input.trim()) && (
                <div className={styles.suggestions}>
                  {suggestions.map((topic) => (
                    <div
                      key={topic.id}
                      className={styles.suggestion}
                      onClick={() => handleAddTopic(topic)}
                    >
                      {topic.name}
                    </div>
                  ))}
                  {input.trim() && !topics.some(t => t.name.toLowerCase() === input.trim().toLowerCase()) && (
                    <div
                      className={styles.suggestion}
                      onClick={() => handleAddTopic(null)}
                    >
                      {input.trim()}
                      <span className={styles.newLabel}>(nytt emne)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full visning (ikke-kompakt)
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {itemTopics.length > 0 && (
        <div className={styles.tagsList}>
          {itemTopics.map(topic => (
            <span key={topic.id} className={styles.tag}>
              {topic.name}
              <button
                className={styles.removeTag}
                onClick={() => handleRemoveTopic(topic.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          placeholder="Legg til emne..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              if (suggestions.length > 0) {
                handleAddTopic(suggestions[0]);
              } else {
                handleAddTopic(null);
              }
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
        />
        {showSuggestions && (suggestions.length > 0 || input.trim()) && (
          <div className={styles.suggestions}>
            {suggestions.map((topic) => (
              <div
                key={topic.id}
                className={styles.suggestion}
                onClick={() => handleAddTopic(topic)}
              >
                {topic.name}
              </div>
            ))}
            {input.trim() && !topics.some(t => t.name.toLowerCase() === input.trim().toLowerCase()) && (
              <div
                className={styles.suggestion}
                onClick={() => handleAddTopic(null)}
              >
                {input.trim()}
                <span className={styles.newLabel}>(nytt emne)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
