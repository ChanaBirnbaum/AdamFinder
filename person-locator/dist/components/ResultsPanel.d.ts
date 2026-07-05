import React from 'react';
import type { PersonLocatorProps, PersonResult, PersonType, SearchResults } from '../types';
interface ResultsPanelProps {
    results: SearchResults;
    isLoading: boolean;
    isLoadingMore: boolean;
    isOffline: boolean;
    activeTab: PersonType;
    query: string;
    resultDirection?: 'up' | 'down';
    showTabBar: boolean;
    allowedTypes?: PersonType[];
    onTabChange: (tab: PersonType) => void;
    onSelect: (person: PersonResult) => void;
    loadMore: (tab: PersonType) => void;
    openTikAsir?: PersonLocatorProps['openTikAsir'];
    navigate?: PersonLocatorProps['navigate'];
    HidePhotosSugAdam?: PersonLocatorProps['HidePhotosSugAdam'];
    displayIdNumber?: PersonLocatorProps['displayIdNumber'];
    HideMishmorot?: PersonLocatorProps['HideMishmorot'];
    hideNavigationLinks?: PersonLocatorProps['hideNavigationLinks'];
    additionalResultFields?: string[];
    /** Element the panel should be positioned under/over. Required to portal the panel out of clipping ancestors. */
    anchorRef: React.RefObject<HTMLElement | null>;
}
declare const ResultsPanel: React.ForwardRefExoticComponent<ResultsPanelProps & React.RefAttributes<HTMLDivElement>>;
export default ResultsPanel;
