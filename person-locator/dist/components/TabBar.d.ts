import React from 'react';
import type { PersonType, SearchResults } from '../types';
interface TabBarProps {
    results: SearchResults;
    activeTab: PersonType;
    isLoading: boolean;
    allowedTypes?: PersonType[];
    onTabChange: (tab: PersonType) => void;
}
declare const TabBar: React.FC<TabBarProps>;
export default TabBar;
