import React from 'react';

export interface FilterChip {
  key: string;
  label: string;
  /** Omitted for a filter the user can't remove (e.g. active-only locked for citizens). */
  onRemove?: () => void;
}

/** Applied filters shown above the results in compact mode, where the filters sit in a menu. */
const FilterChips: React.FC<{ chips: FilterChip[] }> = ({ chips }) => (
  <div
    className="plib-flex plib-flex-wrap plib-gap-2 plib-px-4 plib-pt-3 plib-pb-1"
    role="group"
    aria-label="סינונים פעילים"
    // Keep focus in the input so removing a chip doesn't close the control.
    onMouseDown={(e) => e.preventDefault()}
  >
    {chips.map(({ key, label, onRemove }) => (
      <span
        key={key}
        className="plib-inline-flex plib-items-center plib-gap-1.5 plib-h-8 plib-px-3 plib-rounded-full plib-bg-primary-soft plib-text-primary-main plib-font-rubik plib-text-sm plib-font-semibold plib-whitespace-nowrap"
      >
        {label}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="plib-flex plib-items-center plib-justify-center plib-p-0.5 plib-border-0 plib-bg-transparent plib-text-primary-main plib-rounded-full plib-cursor-pointer hover:plib-bg-white focus-visible:plib-outline-none focus-visible:plib-ring-2 focus-visible:plib-ring-primary-main"
            aria-label={`הסר סינון ${label}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    ))}
  </div>
);

export default FilterChips;
