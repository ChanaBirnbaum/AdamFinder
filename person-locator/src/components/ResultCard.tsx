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
  if (type === 'ezrach') return <CitizenIcon className="plib-text-primary-main" />;
  if (type === 'soher')  return <GuardIcon className="plib-text-primary-main" />;
  return <PrisonerIcon className="plib-text-primary-main" />;
}

// ── Inline tooltip ─────────────────────────────────────────────────────────────
const Tip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="plib-relative plib-group plib-flex plib-items-center">
    {children}
    <div
      className="plib-pointer-events-none plib-absolute plib-bottom-full plib-mb-1.5 plib-left-1/2 -plib-translate-x-1/2 plib-whitespace-nowrap plib-rounded-md plib-bg-gray-800 plib-px-2 plib-py-1 plib-text-2xs plib-text-white plib-opacity-0 group-hover:plib-opacity-100 plib-transition-opacity plib-duration-150 plib-z-50 plib-shadow-lg"
      role="tooltip"
    >
      {label}
      <div className="plib-absolute plib-top-full plib-left-1/2 -plib-translate-x-1/2 plib-border-4 plib-border-transparent plib-border-t-gray-800" />
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
      className="plib-p-4 plib-border-b plib-border-divider hover:plib-bg-gray-50 plib-transition-colors plib-duration-100 plib-animate-fadeIn"
    >
      {/* ── Main row ── */}
      <div
        className="plib-flex plib-items-start plib-gap-4 plib-cursor-pointer"
        role="option"
        aria-label={String(person.data['fullName'] ?? '')}
        aria-selected={false}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* ── Avatar ── */}
        <div className="plib-relative plib-flex-shrink-0">
          {showPhoto ? (
            <img src={person.data['photoUrl'] as string} alt={String(person.data['fullName'] ?? '')} className={`plib-w-photo plib-h-photo plib-rounded plib-object-cover plib-border plib-border-photo-frame ${!person.isActive ? 'plib-grayscale' : ''}`} />
          ) : (
            <div className="plib-w-photo plib-h-photo plib-rounded plib-bg-grey-100 plib-flex plib-items-center plib-justify-center plib-border plib-border-photo-frame" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="plib-text-text-disabled">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <span className={`plib-absolute -plib-top-1.25 -plib-right-1.25 plib-w-3.75 plib-h-3.75 plib-rounded-full plib-border-2 plib-border-white ${person.isActive ? 'plib-bg-online' : 'plib-bg-grey-400'}`} aria-hidden="true" />
        </div>

        {/* ── Info ── */}
        <div className="plib-flex-1 plib-min-w-0">

          {/* Row 1 – name | id number */}
          {(() => {
            const idVal = (displayIdNumber ?? []).includes(person.personType) ? person.data['idNumber'] : undefined;
            const [primaryId, ...restRow2] = [idVal, person.data['prisonerNumber'], person.data['rank']].filter(Boolean);
            return (
              <>
                <div className="plib-flex plib-items-center plib-gap-1.5 plib-min-w-0">
                  <p className="plib-font-rubik plib-font-medium plib-text-text-primary plib-text-base plib-truncate">
                    {highlightMatch(String(person.data['fullName'] ?? ''), query)}
                  </p>
                  {primaryId != null && (
                    <>
                      <span className="plib-w-px plib-h-4 plib-bg-divider plib-flex-shrink-0" aria-hidden="true" />
                      <p className="plib-font-rubik plib-font-medium plib-text-text-primary plib-text-base plib-flex-shrink-0">
                        {String(primaryId)}
                      </p>
                    </>
                  )}
                  {!hideNavigationLinks && person.personType === 'asir' && openTikAsir && (
                    <Tip label="תיק אסיר">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openTikAsir(person); }}
                        className="plib-text-rose-400 hover:plib-text-rose-600 focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-rose-400 plib-rounded plib-transition-colors"
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
                        className="plib-text-gray-300 hover:plib-text-gray-500 focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-gray-400 plib-rounded plib-transition-colors"
                        aria-label={`פרופיל – ${String(person.data['fullName'] ?? '')}`}
                      >
                        <ExternalIcon />
                      </button>
                    </Tip>
                  )}
                </div>

                {/* Row 2 – remaining prisoner number / rank */}
                {restRow2.length > 0 && (
                  <p className="plib-font-rubik plib-font-normal plib-text-sm plib-text-text-muted plib-text-right plib-mt-0.5">
                    {restRow2.join(' · ')}
                  </p>
                )}
              </>
            );
          })()}

          {/* Row 3 – unit / shibutz / phone */}
          {[person.data['unit'], person.data['shibutz'], !HideMishmorot ? person.data['phone'] : undefined].some(Boolean) && (
            <p className="plib-font-rubik plib-font-normal plib-text-sm plib-text-text-muted plib-text-right plib-mt-0.5">
              {[person.data['unit'], person.data['shibutz'], !HideMishmorot ? person.data['phone'] : undefined].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* ── Expand arrow (if any) on top; custody badges + type icon pinned to the card bottom ── */}
        <div className="plib-flex plib-flex-col plib-items-end plib-justify-end plib-self-stretch plib-flex-shrink-0">
          {hasExpandableFields && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="plib-mb-auto plib-flex-shrink-0 plib-text-gray-300 hover:plib-text-gray-500 plib-transition-colors focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-gray-300 plib-rounded plib-p-0.5"
              aria-expanded={expanded}
              aria-label={expanded ? 'סגור פרטים' : 'פרטים נוספים'}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </button>
          )}
          <div className="plib-flex plib-items-center plib-gap-2">
            {(() => {
              const mishmorot = person.data['mishmorot'] as Array<{ title: string; status: BadgeStatus }> | undefined;
              return mishmorot?.length ? (
                <div className="plib-flex plib-flex-wrap plib-gap-1 plib-justify-end">
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
        <div className="plib-mt-2 plib-mx-1 plib-rounded-lg plib-bg-gray-50 plib-border plib-border-gray-100 plib-px-3 plib-py-2.5 plib-grid plib-grid-cols-2 plib-gap-x-4 plib-gap-y-2">
          {additionalResultFields.map((field) => {
            const val = person.data[field];
            if (val == null) return null;
            return (
              <div key={field} className="plib-text-right">
                <p className="plib-text-3xs plib-text-gray-400 plib-mb-0.5">{field}</p>
                <p className="plib-text-xs plib-text-gray-700 plib-font-medium">{String(val)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
