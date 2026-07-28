import React, { useState, useRef, useLayoutEffect } from 'react';
import type { PersonLocatorProps, PersonResult, PersonType } from '../types';
import { highlightMatch } from '../utils/highlightMatch';
import { CitizenIcon, GuardIcon, PrisonerIcon } from './icons';
import Badge, { type BadgeStatus } from './Badge';
import Tip from './Tooltip';

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

// Reports whether a single-line (truncated) element is actually overflowing its
// box — so we only surface the full-text tooltip when the ellipsis is showing.
// Re-measures on element resize (badges appearing/disappearing change its width).
function useIsTruncated(text: string) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return { ref, truncated };
}

// A single-line text that ellipsizes and, only while actually clipped, exposes the
// full text as a hover tooltip over its own area.
const TruncatingText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const { ref, truncated } = useIsTruncated(text);
  return <p ref={ref} className={className} title={truncated ? text : undefined}>{text}</p>;
};

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

  // ── Text rows ──────────────────────────────────────────────────────────────
  const fullName = String(person.data['fullName'] ?? '');
  const idVal = (displayIdNumber ?? []).includes(person.personType) ? person.data['idNumber'] : undefined;
  const [primaryId, ...restRow2] = [idVal, person.data['prisonerNumber'], person.data['rank']].filter(Boolean);
  const row3Parts = [person.data['unit'], person.data['shibutz'], !HideMishmorot ? person.data['phone'] : undefined].filter(Boolean);
  // Body lines below the title, built as a list and filtered to the ones that have
  // content — so this stays correct no matter which rows a given person type yields.
  // The trailing rail (badges + type icon) attaches to the LAST line only, so it
  // competes for width solely with the text physically beside it; every line above
  // (title included) keeps the full width. Empty body → rail rides the title line.
  const bodyLines = [restRow2.join(' · '), row3Parts.join(' · ')].filter((s) => s.length > 0);
  const badgesOnTitle = bodyLines.length === 0;

  const mishmorot = person.data['mishmorot'] as Array<{ title: string; status: BadgeStatus }> | undefined;
  const { ref: nameRef, truncated: nameTruncated } = useIsTruncated(fullName);

  const chevronBtn = hasExpandableFields ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
      className="plib-flex-shrink-0 plib-text-gray-300 hover:plib-text-gray-500 plib-transition-colors focus-visible:plib-outline-none focus-visible:plib-ring-1 focus-visible:plib-ring-gray-300 plib-rounded plib-p-0.5"
      aria-expanded={expanded}
      aria-label={expanded ? 'סגור פרטים' : 'פרטים נוספים'}
    >
      {expanded ? <ChevronUp /> : <ChevronDown />}
    </button>
  ) : null;

  // Custody badges + person-type icon; pinned to the end of whichever row is last.
  const trailing = (
    <div className="plib-flex plib-items-end plib-gap-2 plib-flex-shrink-0">
      {mishmorot?.length ? (
        <div className="plib-flex plib-flex-wrap plib-gap-1 plib-justify-end plib-items-end">
          {mishmorot.map((m, i) => <Badge key={i} status={m.status} label={m.title} size="compact" />)}
        </div>
      ) : null}
      <TypeIcon type={person.personType} />
    </div>
  );

  return (
    <div
      ref={isLast ? lastRef : undefined}
      className="plib-px-4 plib-py-2.5 plib-border-b plib-border-divider hover:plib-bg-gray-50 plib-transition-colors plib-duration-100 plib-animate-fadeIn"
    >
      {/* ── Main row ── */}
      <div
        className="plib-flex plib-items-center plib-gap-3 plib-cursor-pointer"
        role="option"
        aria-label={fullName}
        aria-selected={false}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={nameTruncated ? fullName : undefined}
      >
        {/* ── Avatar ── */}
        <div className="plib-relative plib-flex-shrink-0">
          {showPhoto ? (
            <img src={person.data['photoUrl'] as string} alt={fullName} className={`plib-w-10 plib-h-10 plib-rounded plib-object-cover plib-border plib-border-photo-frame ${!person.isActive ? 'plib-grayscale' : ''}`} />
          ) : (
            <div className="plib-w-10 plib-h-10 plib-rounded plib-bg-grey-100 plib-flex plib-items-center plib-justify-center plib-border plib-border-photo-frame" aria-hidden="true">
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
          <div className="plib-flex plib-items-center plib-gap-1.5 plib-min-w-0">
            <p ref={nameRef} className="plib-font-rubik plib-font-medium plib-text-text-primary plib-text-base plib-leading-tight plib-truncate plib-min-w-0">
              {highlightMatch(fullName, query)}
            </p>
            {primaryId != null && (
              <>
                <span className="plib-w-px plib-h-4 plib-bg-divider plib-flex-shrink-0" aria-hidden="true" />
                <p className="plib-font-rubik plib-font-medium plib-text-text-primary plib-text-base plib-leading-tight plib-flex-shrink-0">
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
                  aria-label={`תיק אסיר – ${fullName}`}
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
                  aria-label={`פרופיל – ${fullName}`}
                >
                  <ExternalIcon />
                </button>
              </Tip>
            )}
            {(chevronBtn || badgesOnTitle) && (
              <div className="plib-ml-auto plib-flex plib-items-center plib-gap-2 plib-flex-shrink-0 plib-pl-1">
                {chevronBtn}
                {badgesOnTitle && trailing}
              </div>
            )}
          </div>

          {/* Body lines — the last one shares its row with the badges (so only it can
              truncate against them + tooltip); the rest stay full-width and wrap. */}
          {bodyLines.map((line, i) => {
            const isLastLine = i === bodyLines.length - 1;
            const base = 'plib-font-rubik plib-font-normal plib-text-sm plib-text-text-muted plib-text-right plib-leading-tight plib-flex-1 plib-min-w-0';
            return (
              <div key={i} className="plib-flex plib-items-end plib-gap-2 plib-mt-0.5">
                {isLastLine
                  ? <TruncatingText text={line} className={`${base} plib-truncate`} />
                  : <p className={base}>{line}</p>}
                {isLastLine && trailing}
              </div>
            );
          })}
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
