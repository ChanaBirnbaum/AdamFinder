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
  asir:   { active: 'plib-border-b plib-border-primary-main plib-text-primary-main', badge: 'plib-bg-primary-soft plib-text-primary-main', ring: 'focus-visible:plib-ring-primary-main' },
  soher:  { active: 'plib-border-b plib-border-primary-main plib-text-primary-main', badge: 'plib-bg-primary-soft plib-text-primary-main', ring: 'focus-visible:plib-ring-primary-main' },
  ezrach: { active: 'plib-border-b plib-border-primary-main plib-text-primary-main', badge: 'plib-bg-primary-soft plib-text-primary-main', ring: 'focus-visible:plib-ring-primary-main' },
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
    <div className="plib-flex plib-border-b plib-border-grey-50" role="tablist" aria-label="קטגוריות תוצאות">
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
              'plib-flex plib-items-center plib-gap-0.5 plib-h-12 plib-px-2 plib-py-2.5 plib-font-rubik plib-text-base plib-transition-colors focus-visible:plib-outline-none focus-visible:plib-ring-2 plib-bg-transparent',
              style.ring,
              isActive ? style.active : 'plib-border-b plib-border-transparent plib-text-text-muted',
            ].join(' ')}
            onClick={() => onTabChange(tab.type)}
          >
             <div className="plib-flex plib-items-center plib-justify-center plib-p-0.5 plib-rounded-lg plib-shrink-0">
              <TabIcon type={tab.type} active={isActive} />
            </div>
            <span className={isActive ? 'plib-font-semibold' : 'plib-font-normal'}>{tab.label}</span>
            {count > 0 && (
              <span className={`plib-text-sm plib-rounded-full plib-min-w-6 plib-h-6 plib-px-1.5 plib-flex plib-items-center plib-justify-center plib-shrink-0 ${isActive ? style.badge : 'plib-bg-grey-50 plib-text-text-muted'}`}>
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
