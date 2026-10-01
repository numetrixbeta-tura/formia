import { useCallback, useEffect, useState } from 'react';
import type { FormValues } from '../types';

const STORAGE_KEY = 'formia-simplificado-draft-v1';
const STORAGE_META_KEY = 'formia-simplificado-draft-meta-v1';

export function useDraft() {
  const [values, setValues] = useState<FormValues>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const meta = localStorage.getItem(STORAGE_META_KEY);
      if (raw) {
        setValues(JSON.parse(raw));
        setHasDraft(true);
      }
      if (meta) {
        setLastSavedAt(JSON.parse(meta).savedAt ?? null);
      }
    } catch {
      // localStorage no disponible o datos corruptos: se ignora y se inicia limpio
    }
  }, []);

  const setField = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setMany = useCallback((patch: FormValues) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveDraft = useCallback((current: FormValues) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      const savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ savedAt, version: 1 }));
      setLastSavedAt(savedAt);
      setHasDraft(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
    setValues({});
    setLastSavedAt(null);
    setHasDraft(false);
  }, []);

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setValues(JSON.parse(raw));
        return true;
      }
    } catch {
      /* noop */
    }
    return false;
  }, []);

  // Autoguardado con debounce cada vez que cambian los valores.
  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    const t = setTimeout(() => {
      saveDraft(values);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return { values, setField, setMany, saveDraft, clearDraft, loadDraft, lastSavedAt, hasDraft };
}
