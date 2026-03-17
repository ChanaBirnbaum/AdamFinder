import { useState, useCallback } from 'react';
import type { PersonType } from '../types';

export interface RecentPerson {
  id: string;
  fullName: string;
  personType: PersonType;
}

const STORAGE_KEY = 'person-locator:recent';
const MAX_ITEMS = 5;

const VALID_TYPES = new Set(['asir', 'soher', 'ezrach']);

const isValidPerson = (item: unknown): item is RecentPerson =>
  typeof item === 'object' &&
  item !== null &&
  typeof (item as RecentPerson).id === 'string' &&
  typeof (item as RecentPerson).fullName === 'string' &&
  VALID_TYPES.has((item as RecentPerson).personType);

const read = (): RecentPerson[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPerson);
  } catch {
    return [];
  }
};

const write = (items: RecentPerson[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
};

export const useRecentSearches = () => {
  const [recents, setRecents] = useState<RecentPerson[]>(read);

  const addPerson = useCallback((person: RecentPerson) => {
    const next = [person, ...read().filter((r) => r.id !== person.id)].slice(0, MAX_ITEMS);
    write(next);
    setRecents(next);
  }, []);

  const removePerson = useCallback((id: string) => {
    const next = read().filter((r) => r.id !== id);
    write(next);
    setRecents(next);
  }, []);

  const clearAll = useCallback(() => {
    write([]);
    setRecents([]);
  }, []);

  return { recents, addPerson, removePerson, clearAll };
};
