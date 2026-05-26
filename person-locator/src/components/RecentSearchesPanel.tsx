import React from 'react';
import type { PersonType } from '../types';
import type { RecentPerson } from '../hooks/useRecentSearches';

const TYPE_META: Record<PersonType, { label: string; dotClass: string; textClass: string }> = {
  asir: { label: 'אסיר',  dotClass: 'bg-rose-400',    textClass: 'text-rose-500' },
  soher:    { label: 'סוהר',  dotClass: 'bg-blue-400',    textClass: 'text-blue-500' },
  ezrach: { label: 'אזרח',  dotClass: 'bg-emerald-400', textClass: 'text-emerald-500' },
};

const XSmall = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface RecentSearchesPanelProps {
  recents: RecentPerson[];
  onSelect: (person: RecentPerson) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  resultDirection?: 'up' | 'down';
}

const RecentSearchesPanel: React.FC<RecentSearchesPanelProps> = ({
  recents,
  onSelect,
  onRemove,
  onClearAll,
  resultDirection = 'down',
}) => {
  if (recents.length === 0) return null;

  const panelClass =
    resultDirection === 'up'
      ? 'absolute bottom-full w-full z-50 bg-white rounded-t-xl shadow-lg border border-b-0 border-gray-200'
      : 'absolute top-full w-full z-50 bg-white rounded-b-xl shadow-lg border border-t-0 border-gray-200';

  return (
    <div className={panelClass} role="listbox" aria-label="חיפושים אחרונים" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-[11px] text-gray-400 font-medium">חיפושים אחרונים</span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 rounded"
        >
          נקה הכל
        </button>
      </div>

      {/* Items */}
      {recents.map((person) => {
        const meta = TYPE_META[person.personType];
        const fullName = String(person.data['fullName'] ?? '');
        return (
          <div
            key={person.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group transition-colors"
            role="option"
            aria-selected={false}
            tabIndex={0}
            onClick={() => onSelect(person)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(person); } }}
          >
            {/* Name + type badge — right in RTL (first child) */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Type badge */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
                <span className={`text-[10px] font-semibold ${meta.textClass}`}>{meta.label}</span>
              </div>
              {/* Name */}
              <span className="text-sm text-gray-700 truncate">{fullName}</span>
            </div>

            {/* Remove button — left in RTL (last child) */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(person.id); }}
              className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 rounded p-0.5 flex-shrink-0"
              aria-label={`הסר ${String(person.data['fullName'] ?? '')}`}
            >
              <XSmall />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RecentSearchesPanel;
