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
  if (type === 'ezrach') return <CitizenIcon className="plib-text-primary-main" />;
  if (type === 'soher')  return <GuardIcon className="plib-text-primary-main" />;
  return <PrisonerIcon className="plib-text-primary-main" />;
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
  // plib-root scopes the library reset onto this portaled subtree; plib-font-sans
  // replaces the font it previously inherited from the consumer's <body>.
  const panelClass =
    resultDirection === 'up'
      ? 'plib-root plib-font-sans plib-z-50 plib-bg-white plib-rounded-t-xl plib-shadow-lg plib-border plib-border-b-0 plib-border-gray-200'
      : 'plib-root plib-font-sans plib-z-50 plib-bg-white plib-rounded-b-xl plib-shadow-lg plib-border plib-border-t-0 plib-border-gray-200';

  // Panel is portaled to <body>, so it needs its own fixed-position coordinates
  // pinned to the anchor element instead of relying on a relative-positioned parent.
  const panelStyle = useAnchoredPosition(anchorRef, resultDirection);

  if (recents.length === 0) return null;

  return createPortal(
    <div ref={forwardedRef} className={panelClass} style={panelStyle} role="listbox" aria-label="חיפושים אחרונים" dir="rtl">
      {/* Header */}
      <div className="plib-flex plib-items-center plib-justify-between plib-px-3 plib-py-2 plib-border-b plib-border-gray-100">
        <span className="plib-text-2xs plib-text-gray-400 plib-font-medium">חיפושים אחרונים</span>
        <button
          type="button"
          onClick={onClearAll}
          className="plib-text-2xs plib-text-gray-400 hover:plib-text-gray-600 plib-transition-colors focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-gray-300 plib-rounded"
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
            className="plib-flex plib-items-center plib-justify-between plib-px-3 plib-py-2 hover:plib-bg-gray-50 plib-cursor-pointer plib-group plib-transition-colors"
            role="option"
            aria-selected={false}
            tabIndex={0}
            onClick={() => onSelect(person)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(person); } }}
          >
            {/* Name — right in RTL (first child) */}
            <div className="plib-flex plib-items-center plib-min-w-0">
              <span className="plib-text-sm plib-text-gray-700 plib-truncate">{fullName}</span>
            </div>

            {/* Type icon + remove button — left in RTL (last child) */}
            <div className="plib-flex plib-items-center plib-gap-1 plib-flex-shrink-0">
              <span role="img" aria-label={TYPE_LABEL[person.personType]}>
                <TypeIcon type={person.personType} />
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(person.id); }}
                className="plib-text-gray-300 hover:plib-text-gray-500 plib-transition-colors plib-opacity-0 group-hover:plib-opacity-100 focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-gray-300 plib-rounded plib-p-0.5 plib-flex-shrink-0"
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
