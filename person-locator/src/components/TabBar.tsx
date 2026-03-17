import React from 'react';
import type { PersonResult, PersonType, SearchResults } from '../types';

interface TabBarProps {
  results: SearchResults;
  activeTab: PersonType;
  isLoading: boolean;
  onTabChange: (tab: PersonType) => void;
}

const TABS: { type: PersonType; label: string }[] = [
  { type: 'asir', label: 'אסירים' },
  { type: 'soher',    label: 'סוהרים' },
  { type: 'ezrach', label: 'אזרחים' },
];

const TYPE_STYLE: Record<PersonType, { active: string; badge: string; ring: string }> = {
  asir: { active: 'border-b-2 border-rose-500 text-rose-600 font-medium',    badge: 'bg-rose-100 text-rose-600',    ring: 'focus-visible:ring-rose-400' },
  soher:    { active: 'border-b-2 border-blue-500 text-blue-600 font-medium',     badge: 'bg-blue-100 text-blue-600',    ring: 'focus-visible:ring-blue-400' },
  ezrach: { active: 'border-b-2 border-emerald-500 text-emerald-600 font-medium', badge: 'bg-emerald-100 text-emerald-600', ring: 'focus-visible:ring-emerald-400' },
};

const getResults = (results: SearchResults, type: PersonType): PersonResult[] => {
  if (type === 'asir') return results.asirs;
  if (type === 'soher') return results.sohers;
  return results.ezrachs;
};

const TabBar: React.FC<TabBarProps> = ({ results, activeTab, isLoading, onTabChange }) => {
  const visibleTabs = TABS.filter(
    (tab) => isLoading || getResults(results, tab.type).length > 0
  );

  if (visibleTabs.length === 0) return null;

  return (
    <div className="flex border-b border-gray-100" role="tablist" aria-label="קטגוריות תוצאות">
      {visibleTabs.map((tab) => {
        const count = getResults(results, tab.type).length;
        const isActive = activeTab === tab.type;
        const style = TYPE_STYLE[tab.type];
        return (
          <button
            key={tab.type}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.type}`}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 min-h-[44px]',
              style.ring,
              isActive ? style.active : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
            onClick={() => onTabChange(tab.type)}
          >
            <span>{tab.label}</span>
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? style.badge : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
