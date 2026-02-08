import { useState, useRef } from 'react';
import {
  downloadUserData,
  importUserData,
  validateUserDataExport,
  getImportSummary,
  type UserDataExport,
} from '@/lib/user-data';

export function useDataImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<UserDataExport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  async function handleExport() {
    await downloadUserData();
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!validateUserDataExport(data)) {
          setImportError('Ugyldig filformat. Velg en gyldig eksportfil.');
          setImportData(null);
          return;
        }

        setImportData(data);
      } catch {
        setImportError('Kunne ikke lese filen. Sjekk at det er en gyldig JSON-fil.');
        setImportData(null);
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  }

  async function handleImport(merge: boolean) {
    if (!importData) return;

    try {
      await importUserData(importData, merge);
      setImportSuccess(true);
      setImportData(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Kunne ikke importere data.');
    }
  }

  function cancelImport() {
    setImportData(null);
    setImportError(null);
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  return {
    fileInputRef,
    importData,
    importError,
    importSuccess,
    handleExport,
    handleFileSelect,
    handleImport,
    cancelImport,
    triggerFileSelect,
    getImportSummary,
  };
}
