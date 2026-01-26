import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ReferenceInput.module.scss';

interface Book {
  id: number;
  name: string;
  name_no: string;
  short_name: string;
  testament: string;
  chapters: number;
}

interface BookSuggestion {
  book: Book;
  matchedAlias: string;
}

interface ReferenceResult {
  success: boolean;
  isReference?: boolean;
  reference?: {
    book: Book;
    chapter: number;
    verseStart?: number;
    verseEnd?: number;
    url: string;
    formatted: string;
    verseCount: number;
  };
  error?: string;
  suggestions?: BookSuggestion[];
  partial?: {
    book?: Book;
    chapter?: number;
    verseCount?: number;
  };
}

interface Props {
  onTextSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export function ReferenceInput({
  onTextSearch,
  placeholder = 'Søk eller skriv referanse (f.eks. "joh 3:16")...',
  autoFocus = false,
  initialValue = ''
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [verseCount, setVerseCount] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSelectedBook(null);
      setHint(null);
      setVerseCount(null);
      return;
    }

    setLoading(true);

    try {
      // Try to parse as reference
      const refResponse = await fetch(`/api/reference?q=${encodeURIComponent(searchQuery)}`);
      const refData: ReferenceResult = await refResponse.json();

      if (refData.success && refData.reference) {
        // Valid reference found
        setSelectedBook(refData.reference.book);
        setVerseCount(refData.reference.verseCount);
        setHint(`${refData.reference.formatted}`);
        setSuggestions([]);
        setShowDropdown(false);
      } else if (refData.isReference) {
        // Partial reference or suggestions
        if (refData.partial?.book) {
          setSelectedBook(refData.partial.book);
          if (refData.partial.chapter && refData.partial.verseCount) {
            setVerseCount(refData.partial.verseCount);
            setHint(`(1-${refData.partial.verseCount} vers)`);
          } else {
            setHint(`(1-${refData.partial.book.chapters} kapitler)`);
            setVerseCount(null);
          }
          setSuggestions([]);
          setShowDropdown(false);
        } else if (refData.suggestions && refData.suggestions.length > 0) {
          setSuggestions(refData.suggestions);
          setSelectedBook(null);
          setHint(null);
          setVerseCount(null);
          setShowDropdown(true);
        }
      } else {
        // Not a reference, get book suggestions anyway for partial matches
        const suggestResponse = await fetch(`/api/reference/suggest?q=${encodeURIComponent(searchQuery)}`);
        const suggestData = await suggestResponse.json();

        if (suggestData.suggestions && suggestData.suggestions.length > 0) {
          setSuggestions(suggestData.suggestions.slice(0, 8));
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
        setSelectedBook(null);
        setHint(null);
        setVerseCount(null);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }

    setLoading(false);
  }, []);

  // Handle input change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    // Try to parse as reference first
    try {
      const response = await fetch(`/api/reference?q=${encodeURIComponent(query)}`);
      const data: ReferenceResult = await response.json();

      if (data.success && data.reference) {
        navigate(data.reference.url);
        return;
      }
    } catch (error) {
      console.error('Failed to parse reference:', error);
    }

    // Not a valid reference, do text search
    if (onTextSearch) {
      onTextSearch(query);
    } else {
      navigate(`/sok?q=${encodeURIComponent(query)}`);
    }
  }

  // Handle suggestion click
  function handleSuggestionClick(suggestion: BookSuggestion) {
    setQuery(suggestion.book.short_name + ' ');
    setSelectedBook(suggestion.book);
    setHint(`(1-${suggestion.book.chapters} kapitler)`);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  }

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder={placeholder}
            className={styles.input}
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-label="Søk etter bibelreferanse eller tekst"
            aria-autocomplete="list"
            aria-expanded={showDropdown && suggestions.length > 0}
            aria-controls="reference-suggestions"
          />
          {hint && (
            <span className={styles.hint}>{hint}</span>
          )}
          {loading && (
            <span className={styles.loading}></span>
          )}
        </div>
        <button type="submit" className={styles.button}>
          Gå
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div ref={dropdownRef} id="reference-suggestions" role="listbox" className={styles.dropdown}>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.book.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.bookName}>{suggestion.book.name_no}</span>
              <span className={styles.bookMeta}>
                {suggestion.book.short_name} ({suggestion.book.chapters} <abbr title="kapitler">kap.</abbr>)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
