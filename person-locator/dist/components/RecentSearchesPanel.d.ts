import React from 'react';
import type { RecentPerson } from '../hooks/useRecentSearches';
interface RecentSearchesPanelProps {
    recents: RecentPerson[];
    onSelect: (person: RecentPerson) => void;
    onRemove: (id: string) => void;
    onClearAll: () => void;
    resultDirection?: 'up' | 'down';
}
declare const RecentSearchesPanel: React.FC<RecentSearchesPanelProps>;
export default RecentSearchesPanel;
