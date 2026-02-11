import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getDevotionals, saveDevotionals, migrateToIndexedDB } from '@/lib/offline/userData';
import type { Devotional, DevotionalType, DevotionalPresentation } from '@/types/devotional';
import { generateId, generateSlug, ensureUniqueSlug, extractVerseRefs, createVersion, getCurrentDraft, getCurrentContent } from '@/lib/devotional-utils';

interface DevotionalsContextType {
  devotionals: Devotional[];
  loaded: boolean;
  addDevotional: (data: { title: string; slug?: string; date: string; type: DevotionalType; tags: string[]; content: string }) => Devotional;
  updateDevotional: (id: string, data: Partial<Pick<Devotional, 'title' | 'date' | 'type' | 'tags' | 'slug'>>) => void;
  updateDraftContent: (id: string, content: string) => void;
  lockVersion: (devotionalId: string, versionName: string) => void;
  addPresentation: (devotionalId: string, versionId: string, data: Omit<DevotionalPresentation, 'id'>) => void;
  updatePresentation: (devotionalId: string, versionId: string, presentationId: string, data: Omit<DevotionalPresentation, 'id'>) => void;
  removePresentation: (devotionalId: string, versionId: string, presentationId: string) => void;
  duplicateVersionToNew: (devotionalId: string, versionId: string) => Devotional | undefined;
  deleteDevotional: (id: string) => void;
  getDevotionalBySlug: (slug: string) => Devotional | undefined;
  getDevotionalById: (id: string) => Devotional | undefined;
  getDevotionalsForVerse: (ref: string) => Devotional[];
  getDevotionalsByTag: (tag: string) => Devotional[];
  getDevotionalsByType: (type: DevotionalType) => Devotional[];
  getAllTags: () => string[];
  searchDevotionals: (query: string) => Devotional[];
}

const DevotionalsContext = createContext<DevotionalsContextType | null>(null);

const typeMapping: Record<string, DevotionalType> = {
  tale: 'preken',
  bibelstudium: 'bibeltime',
};

/**
 * Migrate old devotionals that have content but no versions,
 * and map old type names to new ones.
 */
function migrateDevotional(d: unknown): Devotional {
  const dev = d as Devotional & { content?: string };

  // Migrate old type names
  if (dev.type && typeMapping[dev.type as string]) {
    dev.type = typeMapping[dev.type as string];
  }

  if (dev.versions && dev.versions.length > 0) return dev as Devotional;

  // Old format had content directly on the object
  const content = dev.content ?? '';
  const { content: _, ...rest } = dev as Devotional & { content?: string };
  return {
    ...rest,
    versions: [createVersion(content)],
  } as Devotional;
}

export function DevotionalsProvider({ children }: { children: ReactNode }) {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      await migrateToIndexedDB();
      const data = await getDevotionals();
      const migrated = data.map(migrateDevotional);
      setDevotionals(migrated);
      setLoaded(true);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) {
      saveDevotionals(devotionals);
    }
  }, [devotionals, loaded]);

  function addDevotional(data: { title: string; slug?: string; date: string; type: DevotionalType; tags: string[]; content: string }): Devotional {
    const existingSlugs = devotionals.map(d => d.slug);
    const baseSlug = data.slug || generateSlug(data.title);
    const slug = ensureUniqueSlug(baseSlug, existingSlugs);
    const now = Date.now();
    const verses = extractVerseRefs(data.content);

    const newDevotional: Devotional = {
      id: generateId(),
      slug,
      title: data.title,
      date: data.date,
      type: data.type,
      tags: data.tags,
      verses,
      versions: [createVersion(data.content)],
      createdAt: now,
      updatedAt: now,
    };
    setDevotionals(prev => [...prev, newDevotional]);
    return newDevotional;
  }

  function updateDevotional(id: string, data: Partial<Pick<Devotional, 'title' | 'date' | 'type' | 'tags' | 'slug'>>) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== id) return d;

      const updated = { ...d, ...data, updatedAt: Date.now() };

      // Use explicit slug if provided, otherwise re-generate from title if title changed
      if (data.slug !== undefined) {
        const existingSlugs = prev.filter(x => x.id !== id).map(x => x.slug);
        updated.slug = ensureUniqueSlug(data.slug, existingSlugs);
      } else if (data.title !== undefined && data.title !== d.title) {
        const existingSlugs = prev.filter(x => x.id !== id).map(x => x.slug);
        updated.slug = ensureUniqueSlug(generateSlug(data.title), existingSlugs);
      }

      return updated;
    }));
  }

  function updateDraftContent(id: string, content: string) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== id) return d;

      const draft = getCurrentDraft(d);
      if (!draft) return d;

      const updatedVersions = d.versions.map(v =>
        v.id === draft.id ? { ...v, content } : v
      );

      return {
        ...d,
        versions: updatedVersions,
        verses: extractVerseRefs(content),
        updatedAt: Date.now(),
      };
    }));
  }

  function lockVersion(devotionalId: string, versionName: string) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== devotionalId) return d;

      const draft = getCurrentDraft(d);
      if (!draft) return d;

      const updatedVersions = d.versions.map(v =>
        v.id === draft.id ? { ...v, locked: true, name: versionName } : v
      );

      // Create new draft with copied content
      updatedVersions.push(createVersion(draft.content));

      return {
        ...d,
        versions: updatedVersions,
        updatedAt: Date.now(),
      };
    }));
  }

  function addPresentation(devotionalId: string, versionId: string, data: Omit<DevotionalPresentation, 'id'>) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== devotionalId) return d;

      const updatedVersions = d.versions.map(v => {
        if (v.id !== versionId || !v.locked) return v;
        return {
          ...v,
          presentations: [...v.presentations, { ...data, id: generateId() }],
        };
      });

      return { ...d, versions: updatedVersions, updatedAt: Date.now() };
    }));
  }

  function updatePresentation(devotionalId: string, versionId: string, presentationId: string, data: Omit<DevotionalPresentation, 'id'>) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== devotionalId) return d;

      const updatedVersions = d.versions.map(v => {
        if (v.id !== versionId) return v;
        return {
          ...v,
          presentations: v.presentations.map(p =>
            p.id === presentationId ? { ...data, id: presentationId } : p
          ),
        };
      });

      return { ...d, versions: updatedVersions, updatedAt: Date.now() };
    }));
  }

  function removePresentation(devotionalId: string, versionId: string, presentationId: string) {
    setDevotionals(prev => prev.map(d => {
      if (d.id !== devotionalId) return d;

      const updatedVersions = d.versions.map(v => {
        if (v.id !== versionId) return v;
        return {
          ...v,
          presentations: v.presentations.filter(p => p.id !== presentationId),
        };
      });

      return { ...d, versions: updatedVersions, updatedAt: Date.now() };
    }));
  }

  function duplicateVersionToNew(devotionalId: string, versionId: string): Devotional | undefined {
    const source = devotionals.find(d => d.id === devotionalId);
    if (!source) return undefined;

    const version = source.versions.find(v => v.id === versionId);
    if (!version) return undefined;

    const existingSlugs = devotionals.map(d => d.slug);
    const newTitle = `${source.title} (kopi)`;
    const slug = ensureUniqueSlug(generateSlug(newTitle), existingSlugs);
    const now = Date.now();

    const newDevotional: Devotional = {
      id: generateId(),
      slug,
      title: newTitle,
      date: new Date().toISOString().split('T')[0],
      type: source.type,
      tags: [...source.tags],
      verses: extractVerseRefs(version.content),
      versions: [createVersion(version.content)],
      createdAt: now,
      updatedAt: now,
    };

    setDevotionals(prev => [...prev, newDevotional]);
    return newDevotional;
  }

  function deleteDevotional(id: string) {
    setDevotionals(prev => prev.filter(d => d.id !== id));
  }

  const getDevotionalBySlug = useCallback((slug: string) => {
    return devotionals.find(d => d.slug === slug);
  }, [devotionals]);

  const getDevotionalById = useCallback((id: string) => {
    return devotionals.find(d => d.id === id);
  }, [devotionals]);

  const getDevotionalsForVerse = useCallback((ref: string) => {
    const lower = ref.toLowerCase();
    return devotionals
      .filter(d => d.verses.includes(lower))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [devotionals]);

  const getDevotionalsByTag = useCallback((tag: string) => {
    const lower = tag.toLowerCase();
    return devotionals
      .filter(d => d.tags.some(t => t.toLowerCase() === lower))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [devotionals]);

  const getDevotionalsByType = useCallback((type: DevotionalType) => {
    return devotionals
      .filter(d => d.type === type)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [devotionals]);

  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    devotionals.forEach(d => d.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'nb'));
  }, [devotionals]);

  const searchDevotionals = useCallback((query: string) => {
    const lower = query.toLowerCase();
    return devotionals
      .filter(d =>
        d.title.toLowerCase().includes(lower) ||
        d.tags.some(t => t.toLowerCase().includes(lower)) ||
        getCurrentContent(d).toLowerCase().includes(lower)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [devotionals]);

  return (
    <DevotionalsContext.Provider value={{
      devotionals,
      loaded,
      addDevotional,
      updateDevotional,
      updateDraftContent,
      lockVersion,
      addPresentation,
      updatePresentation,
      removePresentation,
      duplicateVersionToNew,
      deleteDevotional,
      getDevotionalBySlug,
      getDevotionalById,
      getDevotionalsForVerse,
      getDevotionalsByTag,
      getDevotionalsByType,
      getAllTags,
      searchDevotionals,
    }}>
      {children}
    </DevotionalsContext.Provider>
  );
}

export function useDevotionals() {
  const context = useContext(DevotionalsContext);
  if (!context) {
    throw new Error('useDevotionals must be used within DevotionalsProvider');
  }
  return context;
}
