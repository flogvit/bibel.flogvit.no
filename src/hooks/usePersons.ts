

import { useState, useEffect, useCallback } from 'react';
import { getAllStoredPersons, storePersons, getStoredPerson, storePerson } from '@/lib/offline/storage';

export interface Person {
  id: string;
  name: string;
  description?: string;
  meaning?: string;
  born?: string;
  died?: string;
  father?: string;
  mother?: string;
  spouses?: string[];
  children?: string[];
  tribe?: string;
  occupation?: string[];
  significance?: string;
  references?: {
    book_id: number;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    book_short_name?: string;
  }[];
}

interface UsePersonsResult {
  persons: Person[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

interface UsePersonResult {
  person: Person | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
}

export function usePersons(): UsePersonsResult {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPersons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch('/api/persons');

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Personer er ikke tilgjengelig offline');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setPersons(data.persons || []);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB && data.persons?.length > 0) {
        try {
          // Convert API persons to StoredPersonData format
          await storePersons(data.persons.map((p: Person) => ({
            id: p.id,
            name: p.name,
            title: p.description || '',
            era: '',
            summary: p.significance || '',
            roles: p.occupation || [],
            keyEvents: [],
          })));
        } catch (storeError) {
          console.warn('Failed to store persons in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch persons:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getAllStoredPersons();
        if (cached.length > 0) {
          // Convert StoredPersonData back to Person format
          setPersons(cached.map(p => ({
            id: p.id,
            name: p.name,
            description: p.title,
            significance: p.summary,
            occupation: p.roles,
          } as Person)));
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste personer');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && persons.length === 0) {
        fetchPersons();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, persons.length, fetchPersons]);

  return {
    persons,
    isLoading,
    error,
    isOffline,
    refetch: fetchPersons,
  };
}

export function usePerson(personId: string): UsePersonResult {
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchPerson = useCallback(async () => {
    if (!personId) return;

    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await fetch(`/api/persons/${encodeURIComponent(personId)}`);

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.offline) {
            setIsOffline(true);
            setError('Personen er ikke tilgjengelig offline');
            return;
          }
        }
        if (response.status === 404) {
          setError('Personen ble ikke funnet');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if response came from IndexedDB (via service worker)
      const fromIndexedDB = response.headers.get('X-From-IndexedDB') === 'true';
      if (fromIndexedDB) {
        setIsOffline(true);
      }

      setPerson(data);

      // Store in IndexedDB for offline use (if not already from IDB)
      if (!fromIndexedDB && data) {
        try {
          await storePerson({
            id: data.id,
            name: data.name,
            title: data.description || '',
            era: '',
            summary: data.significance || '',
            roles: data.occupation || [],
            keyEvents: [],
          });
        } catch (storeError) {
          console.warn('Failed to store person in IndexedDB:', storeError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch person:', err);

      // Try to load from IndexedDB as fallback
      try {
        const cached = await getStoredPerson(personId);
        if (cached) {
          setPerson({
            id: cached.id,
            name: cached.name,
            description: cached.title,
            significance: cached.summary,
            occupation: cached.roles,
          } as Person);
          setIsOffline(true);
          return;
        }
      } catch (idbError) {
        console.warn('IndexedDB fallback failed:', idbError);
      }

      setError('Kunne ikke laste personen');
      setIsOffline(!navigator.onLine);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline && !person) {
        fetchPerson();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, person, fetchPerson]);

  return {
    person,
    isLoading,
    error,
    isOffline,
    refetch: fetchPerson,
  };
}
