import type { PersonType } from '../types';
export interface RecentPerson {
    id: string;
    fullName: string;
    personType: PersonType;
}
export declare const useRecentSearches: () => {
    recents: RecentPerson[];
    addPerson: (person: RecentPerson) => void;
    removePerson: (id: string) => void;
    clearAll: () => void;
};
