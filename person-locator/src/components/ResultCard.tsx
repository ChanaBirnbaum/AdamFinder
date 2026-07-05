import React, { useState } from 'react';
import type { PersonLocatorProps, PersonResult, PersonType } from '../types';
import { highlightMatch } from '../utils/highlightMatch';
import { CitizenIcon, GuardIcon, PrisonerIcon } from './icons';
import Badge, { type BadgeStatus } from './Badge';

interface ResultCardProps {
  person: PersonResult;
  query: string;
  isLast?: boolean;
  lastRef?: (node: HTMLElement | null) => void;
  onSelect: (person: PersonResult) => void;
  openTikAsir?: PersonLocatorProps['openTikAsir'];
  navigate?: PersonLocatorProps['navigate'];
  HidePhotosSugAdam?: PersonLocatorProps['HidePhotosSugAdam'];
  displayIdNumber?: PersonLocatorProps['displayIdNumber'];
  HideMishmorot?: PersonLocatorProps['HideMishmorot'];
  hideNavigationLinks?: PersonLocatorProps['hideNavigationLinks'];
  additionalResultFields?: string[];
}

function TypeIcon({ type }: { type: PersonType }) {
  if (type === 'ezrach') return <CitizenIcon className="text-primary-main" />;
  if (type === 'soher')  return <GuardIcon className="text-primary-main" />;
  return <PrisonerIcon className="text-primary-main" />;
}

// ── Inline tooltip ─────────────────────────────────────────────────────────────
const Tip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group flex items-center">
    {children}
    <div
      className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-2xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg"
      role="tooltip"
    >
      {label}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

// ── Icons ──────────────────────────────────────────────────────────────────────
const TikAsirIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────────
const ResultCard: React.FC<ResultCardProps> = ({
  person,
  query,
  isLast,
  lastRef,
  onSelect,
  openTikAsir,
  navigate,
  HidePhotosSugAdam,
  displayIdNumber,
  HideMishmorot,
  hideNavigationLinks,
  additionalResultFields = [],
}) => {
  const [expanded, setExpanded] = useState(false);

  const showPhoto =
    Boolean(person.data['photoUrl']) &&
    !(HidePhotosSugAdam ?? []).includes(person.personType);

  const hasExpandableFields = additionalResultFields.some(
    (f) => person.data[f] != null
  );

  const handleClick = () => onSelect(person);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(person); }
  };

  return (
    <div
      ref={isLast ? lastRef : undefined}
      className="p-4 border-b border-divider hover:bg-gray-50 transition-colors duration-100 animate-fadeIn"
    >
      {/* ── Main row ── */}
      <div
        className="flex items-start gap-4 cursor-pointer"
        role="option"
        aria-label={String(person.data['fullName'] ?? '')}
        aria-selected={false}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* ── Avatar ── */}
        <div className="relative flex-shrink-0">
          {showPhoto ? (
            <img src={person.data['photoUrl'] as string} alt={String(person.data['fullName'] ?? '')} className={`w-photo h-photo rounded object-cover border border-photo-frame ${!person.isActive ? 'grayscale' : ''}`} />
          ) : (
            <div className="w-photo h-photo rounded bg-grey-100 flex items-center justify-center border border-photo-frame" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-text-disabled">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <span className={`absolute -top-1.25 -right-1.25 w-3.75 h-3.75 rounded-full border-2 border-white ${person.isActive ? 'bg-online' : 'bg-grey-400'}`} aria-hidden="true" />
        </div>

        {/* ── Info ── */}
        <div className="flex-1 min-w-0">

          {/* Row 1 – name | id number */}
          {(() => {
            const idVal = (displayIdNumber ?? []).includes(person.personType) ? person.data['idNumber'] : undefined;
            const [primaryId, ...restRow2] = [idVal, person.data['prisonerNumber'], person.data['rank']].filter(Boolean);
            return (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="font-rubik font-medium text-text-primary text-base truncate">
                    {highlightMatch(String(person.data['fullName'] ?? ''), query)}
                  </p>
                  {primaryId != null && (
                    <>
                      <span className="w-px h-4 bg-divider flex-shrink-0" aria-hidden="true" />
                      <p className="font-rubik font-medium text-text-primary text-base flex-shrink-0">
                        {String(primaryId)}
                      </p>
                    </>
                  )}
                  {!hideNavigationLinks && person.personType === 'asir' && openTikAsir && (
                    <Tip label="תיק אסיר">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openTikAsir(person); }}
                        className="text-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded transition-colors"
                        aria-label={`תיק אסיר – ${String(person.data['fullName'] ?? '')}`}
                      >
                        <TikAsirIcon />
                      </button>
                    </Tip>
                  )}
                  {!hideNavigationLinks && navigate && (
                    <Tip label="פרופיל">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/person/${person.id}`); }}
                        className="text-gray-300 hover:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded transition-colors"
                        aria-label={`פרופיל – ${String(person.data['fullName'] ?? '')}`}
                      >
                        <ExternalIcon />
                      </button>
                    </Tip>
                  )}
                </div>

                {/* Row 2 – remaining prisoner number / rank */}
                {restRow2.length > 0 && (
                  <p className="font-rubik font-normal text-sm text-text-muted text-right mt-0.5">
                    {restRow2.join(' · ')}
                  </p>
                )}
              </>
            );
          })()}

          {/* Row 3 – unit / shibutz / phone */}
          {[person.data['unit'], person.data['shibutz'], !HideMishmorot ? person.data['phone'] : undefined].some(Boolean) && (
            <p className="font-rubik font-normal text-sm text-text-muted text-right mt-0.5">
              {[person.data['unit'], person.data['shibutz'], !HideMishmorot ? person.data['phone'] : undefined].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* ── Expand arrow (if any) on top; custody badges + type icon pinned to the card bottom ── */}
        <div className="flex flex-col items-end justify-end self-stretch flex-shrink-0">
          {hasExpandableFields && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="mb-auto flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 rounded p-0.5"
              aria-expanded={expanded}
              aria-label={expanded ? 'סגור פרטים' : 'פרטים נוספים'}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </button>
          )}
          <div className="flex items-center gap-2">
            {(() => {
              const mishmorot = person.data['mishmorot'] as Array<{ title: string; status: BadgeStatus }> | undefined;
              return mishmorot?.length ? (
                <div className="flex flex-wrap gap-1 justify-end">
                  {mishmorot.map((m, i) => <Badge key={i} status={m.status} label={m.title} />)}
                </div>
              ) : null;
            })()}
            <TypeIcon type={person.personType} />
          </div>
        </div>
      </div>

      {/* ── Expanded fields ── */}
      {expanded && (
        <div className="mt-2 mx-1 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
          {additionalResultFields.map((field) => {
            const val = person.data[field];
            if (val == null) return null;
            return (
              <div key={field} className="text-right">
                <p className="text-3xs text-gray-400 mb-0.5">{field}</p>
                <p className="text-xs text-gray-700 font-medium">{String(val)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
