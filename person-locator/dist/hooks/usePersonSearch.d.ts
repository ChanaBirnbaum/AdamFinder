import type { PersonLocatorProps, PersonResult, PersonType, PagingState, SearchResults } from '../types';
export interface UsePersonSearchReturn {
    results: SearchResults;
    isLoading: boolean;
    isLoadingMore: boolean;
    isOffline: boolean;
    error: string | null;
    selectedPerson: PersonResult | null;
    inputValue: string;
    activeTab: PersonType;
    pagingState: PagingState;
    setInputValue: (v: string) => void;
    setActiveTab: (tab: PersonType) => void;
    selectPerson: (person: PersonResult) => void;
    clearSelection: () => void;
    loadMore: (tab: PersonType) => void;
}
export declare function usePersonSearch(props: PersonLocatorProps): UsePersonSearchReturn;
