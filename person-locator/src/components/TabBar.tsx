import React from 'react';
import type { PersonType, SearchResults } from '../types';
import { CitizenIcon, GuardIcon, PrisonerIcon } from './icons';

interface TabBarProps {
  results: SearchResults;
  activeTab: PersonType;
  isLoading: boolean;
  allowedTypes?: PersonType[];
  onTabChange: (tab: PersonType) => void;
}

const TABS: { type: PersonType; label: string }[] = [
  { type: 'asir', label: 'אסירים' },
  { type: 'soher',    label: 'סוהרים' },
  { type: 'ezrach', label: 'אזרחים' },
];

const TYPE_STYLE: Record<PersonType, { active: string; badge: string; ring: string }> = {
  asir:   { active: 'border-b border-[#006aff] text-[#006aff]', badge: 'bg-[#e6f4ff] text-[#006aff]', ring: 'focus-visible:ring-[#006aff]' },
  soher:  { active: 'border-b border-[#006aff] text-[#006aff]', badge: 'bg-[#e6f4ff] text-[#006aff]', ring: 'focus-visible:ring-[#006aff]' },
  ezrach: { active: 'border-b border-[#006aff] text-[#006aff]', badge: 'bg-[#e6f4ff] text-[#006aff]', ring: 'focus-visible:ring-[#006aff]' },
};

function TabIcon({ type, active }: { type: PersonType; active: boolean }) {
  if (type === 'ezrach') return <CitizenIcon active={active} />;
  if (type === 'soher') return <GuardIcon />;
  return <PrisonerIcon />;
}

const getTotal = (results: SearchResults, type: PersonType): number => {
  return results.totalsByType[type] ?? 0;
};

const TabBar: React.FC<TabBarProps> = ({ results, activeTab, isLoading, allowedTypes, onTabChange }) => {
  const baseTabs = allowedTypes ? TABS.filter(tab => allowedTypes.includes(tab.type)) : TABS;
  const visibleTabs = baseTabs.filter(
    (tab) => isLoading || getTotal(results, tab.type) > 0
  );

  if (visibleTabs.length === 0) return null;

  return (
    <div className="flex border-b border-[#f5f5f5]" role="tablist" aria-label="קטגוריות תוצאות">
      {visibleTabs.map((tab) => {
        const count = getTotal(results, tab.type);
        const isActive = activeTab === tab.type;
        const style = TYPE_STYLE[tab.type];
        return (
          <button
            key={tab.type}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.type}`}
            className={[
              'flex items-center gap-2 h-12 px-2 py-[10px] font-rubik text-base transition-colors focus-visible:outline-none focus-visible:ring-2 bg-transparent',
              style.ring,
              isActive ? style.active : 'border-b border-transparent text-[#8e929f]',
            ].join(' ')}
            onClick={() => onTabChange(tab.type)}
          >
             <div className="flex items-center justify-center p-1 rounded-lg shrink-0">
              <TabIcon type={tab.type} active={isActive} />
            </div>
            <span className={isActive ? 'font-semibold' : 'font-normal'}>{tab.label}</span>
            {count > 0 && (
              <span className={`text-sm rounded-[32px] w-6 h-6 flex items-center justify-center shrink-0 ${isActive ? style.badge : 'bg-[#f5f5f5] text-[#8e929f]'}`}>
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
