import React from 'react';
import { createPortal } from 'react-dom';
import type { PersonType } from '../types';
import type { RecentPerson } from '../hooks/useRecentSearches';
import { useAnchoredPosition } from '../hooks/useAnchoredPosition';
import { CitizenIcon, GuardIcon, PrisonerIcon } from './icons';

const TYPE_LABEL: Record<PersonType, string> = {
  asir:   'אסיר',
  soher:  'סוהר',
  ezrach: 'אזרח',
};

function TypeIcon({ type }: { type: PersonType }) {
  if (type === 'ezrach') return <CitizenIcon className="text-primary-main" />;
  if (type === 'soher')  return <GuardIcon className="text-primary-main" />;
  return <PrisonerIcon className="text-primary-main" />;
}

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
  /** Element the panel should be positioned under/over. Required to portal the panel out of clipping ancestors. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

const RecentSearchesPanel = React.forwardRef<HTMLDivElement, RecentSearchesPanelProps>(({
  recents,
  onSelect,
  onRemove,
  onClearAll,
  resultDirection = 'down',
  anchorRef,
}, forwardedRef) => {
  const panelClass =
    resultDirection === 'up'
      ? 'z-50 bg-white rounded-t-xl shadow-lg border border-b-0 border-gray-200'
      : 'z-50 bg-white rounded-b-xl shadow-lg border border-t-0 border-gray-200';

  // Panel is portaled to <body>, so it needs its own fixed-position coordinates
  // pinned to the anchor element instead of relying on a relative-positioned parent.
  const panelStyle = useAnchoredPosition(anchorRef, resultDirection);

  if (recents.length === 0) return null;

  return createPortal(
    <div ref={forwardedRef} className={panelClass} style={panelStyle} role="listbox" aria-label="חיפושים אחרונים" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-2xs text-gray-400 font-medium">חיפושים אחרונים</span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-2xs text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 rounded"
        >
          נקה הכל
        </button>
      </div>

      {/* Items */}
      {recents.map((person) => {
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
            {/* Name — right in RTL (first child) */}
            <div className="flex items-center min-w-0">
              <span className="text-sm text-gray-700 truncate">{fullName}</span>
            </div>

            {/* Type icon + remove button — left in RTL (last child) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span role="img" aria-label={TYPE_LABEL[person.personType]}>
                <TypeIcon type={person.personType} />
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(person.id); }}
                className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 rounded p-0.5 flex-shrink-0"
                aria-label={`הסר ${String(person.data['fullName'] ?? '')}`}
              >
                <XSmall />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
});

RecentSearchesPanel.displayName = 'RecentSearchesPanel';

export default RecentSearchesPanel;
