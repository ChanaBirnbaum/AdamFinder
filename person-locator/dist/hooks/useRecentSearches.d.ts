import type { PersonResult } from '../types';
export type RecentPerson = PersonResult;
export declare const useRecentSearches: () => {
    recents: PersonResult[];
    addPerson: (person: RecentPerson) => void;
    removePerson: (id: string) => void;
    clearAll: () => void;
};
