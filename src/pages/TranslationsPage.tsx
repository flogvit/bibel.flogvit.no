import { useState, useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getUserBibles, addUserBible, deleteUserBible, storeUserBibleChapters } from '@/lib/offline/userBibles';
import { parseBibleText, type MappingData, type ParseResult } from '@/lib/bibleTextParser';
import type { StoredUserBible } from '@/lib/offline/db';
import styles from '@/styles/pages/translations.module.scss';

interface MappingListItem {
  id: string;
  name: string;
  description: string | null;
}

export function TranslationsPage() {
  const [userBibles, setUserBibles] = useState<StoredUserBible[]>([]);
  const [mappings, setMappings] = useState<MappingListItem[]>([]);
  const [selectedMapping, setSelectedMapping] = useState('');
  const [bibleName, setBibleName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserBibles();
    loadMappings();
  }, []);

  async function loadUserBibles() {
    const bibles = await getUserBibles();
    setUserBibles(bibles);
  }

  async function loadMappings() {
    try {
      const res = await fetch('/api/mappings');
      const data = await res.json();
      setMappings(data.mappings || []);
      if (data.mappings?.length > 0) {
        setSelectedMapping(data.mappings[0].id);
      }
    } catch {
      setError('Kunne ikke laste mappinger fra serveren');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTextContent(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleParse() {
    if (!textContent.trim() || !selectedMapping) return;

    setError(null);
    setParseResult(null);

    try {
      const res = await fetch(`/api/mappings/${selectedMapping}`);
      if (!res.ok) throw new Error('Kunne ikke hente mapping');
      const mappingData: MappingData & { id: string; name: string } = await res.json();

      const tempId = `user:${crypto.randomUUID()}`;
      const result = parseBibleText(textContent, mappingData, tempId);

      if (result.stats.verses === 0) {
        setError('Ingen vers funnet. Sjekk at filformatet er riktig (f.eks. "1 Mos 1,1 I begynnelsen...")');
        return;
      }

      setParseResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parsing feilet');
    }
  }

  async function handleImport() {
    if (!parseResult || !bibleName.trim()) return;

    setImporting(true);
    setImportProgress(0);
    setError(null);

    try {
      const bibleId = parseResult.chapters[0]?.bible || `user:${crypto.randomUUID()}`;

      // Store chapters in batches, updating progress
      const total = parseResult.chapters.length;
      const BATCH = 100;
      for (let i = 0; i < total; i += BATCH) {
        const batch = parseResult.chapters.slice(i, i + BATCH);
        await storeUserBibleChapters(bibleId, batch);
        setImportProgress(Math.min(100, Math.round(((i + batch.length) / total) * 100)));
      }

      // Store metadata
      await addUserBible({
        id: bibleId,
        name: bibleName.trim(),
        mappingId: selectedMapping,
        uploadedAt: Date.now(),
        verseCounts: parseResult.stats,
      });

      setSuccess(`"${bibleName.trim()}" ble importert med ${parseResult.stats.verses} vers.`);
      setParseResult(null);
      setTextContent('');
      setFileName('');
      setBibleName('');
      await loadUserBibles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import feilet');
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(bible: StoredUserBible) {
    if (!confirm(`Slette "${bible.name}"? Dette kan ikke angres.`)) return;

    try {
      await deleteUserBible(bible.id);
      await loadUserBibles();
      setSuccess(`"${bible.name}" ble slettet.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sletting feilet');
    }
  }

  function handleCancel() {
    setParseResult(null);
    setError(null);
  }

  return (
    <div className={styles.main}>
      <div className="container">
      <Breadcrumbs items={[{ label: 'Oversettelser' }]} />

      <h1>Oversettelser</h1>
      <p className={styles.intro}>
        Last opp egne bibeloversettelser. Versene blir mappet til intern nummerering slik at kryssreferanser og andre verktøy fortsatt fungerer.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <section className={styles.section}>
        <h2>Dine oversettelser</h2>
        {userBibles.length === 0 ? (
          <div className={styles.empty}>Ingen egne oversettelser ennå.</div>
        ) : (
          <div className={styles.bibleList}>
            {userBibles.map(bible => (
              <div key={bible.id} className={styles.bibleItem}>
                <div className={styles.bibleInfo}>
                  <h3>{bible.name}</h3>
                  <span className={styles.bibleMeta}>
                    {bible.verseCounts
                      ? `${bible.verseCounts.books} bøker, ${bible.verseCounts.chapters} kapitler, ${bible.verseCounts.verses} vers`
                      : 'Ingen info'}
                    {' \u00b7 '}
                    Lastet opp {new Date(bible.uploadedAt).toLocaleDateString('nb-NO')}
                  </span>
                </div>
                <button className={styles.deleteButton} onClick={() => handleDelete(bible)}>
                  Slett
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Last opp ny oversettelse</h2>
        <div className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label htmlFor="mapping">Versnummerering (mapping)</label>
            <select
              id="mapping"
              className={styles.select}
              value={selectedMapping}
              onChange={e => setSelectedMapping(e.target.value)}
            >
              {mappings.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.description ? ` - ${m.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bibleName">Navn på oversettelsen</label>
            <input
              id="bibleName"
              type="text"
              className={styles.input}
              value={bibleName}
              onChange={e => setBibleName(e.target.value)}
              placeholder="F.eks. Bibel 2011"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bibeltekst</label>
            <div className={styles.fileRow}>
              <button
                className={styles.fileButton}
                onClick={() => fileInputRef.current?.click()}
              >
                Velg fil
              </button>
              <span className={styles.fileName}>
                {fileName || 'Ingen fil valgt'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.text"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
            <p className={styles.orLabel}>eller lim inn tekst:</p>
            <textarea
              className={styles.textarea}
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder={"1 Mos 1,1 I begynnelsen skapte Gud himmelen og jorden.\n1 Mos 1,2 Jorden var øde og tom..."}
            />
          </div>

          <button
            className={styles.parseButton}
            onClick={handleParse}
            disabled={!textContent.trim() || !selectedMapping}
          >
            Analyser tekst
          </button>

          {parseResult && (
            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>Forhåndsvisning</h3>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <strong>{parseResult.stats.books}</strong>
                  <span>bøker</span>
                </div>
                <div className={styles.stat}>
                  <strong>{parseResult.stats.chapters}</strong>
                  <span>kapitler</span>
                </div>
                <div className={styles.stat}>
                  <strong>{parseResult.stats.verses}</strong>
                  <span>vers</span>
                </div>
              </div>

              {parseResult.warnings.length > 0 && (
                <div className={styles.warnings}>
                  {parseResult.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}

              <div className={styles.previewActions}>
                <button
                  className={styles.importButton}
                  onClick={handleImport}
                  disabled={importing || !bibleName.trim()}
                >
                  {importing ? 'Importerer...' : 'Importer'}
                </button>
                <button className={styles.cancelButton} onClick={handleCancel}>
                  Avbryt
                </button>
              </div>

              {importing && (
                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <div className={styles.progressText}>{importProgress}%</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
