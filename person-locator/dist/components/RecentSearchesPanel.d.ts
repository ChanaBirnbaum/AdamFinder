import React from 'react';
import type { RecentPerson } from '../hooks/useRecentSearches';
interface RecentSearchesPanelProps {
    recents: RecentPerson[];
    onSelect: (person: RecentPerson) => void;
    onRemove: (id: string) => void;
    onClearAll: () => void;
    resultDirection?: 'up' | 'down';
    /** Element the panel should be positioned under/over. Required to portal the panel out of clipping ancestors. */
    anchorRef: React.RefObject<HTMLElement | null>;
}
declare const RecentSearchesPanel: React.ForwardRefExoticComponent<RecentSearchesPanelProps & React.RefAttributes<HTMLDivElement>>;
export default RecentSearchesPanel;
