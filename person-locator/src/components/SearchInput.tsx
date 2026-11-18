import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
import FilterMenu from './FilterMenu';
import Toggle from './Toggle';
import Tip from './Tooltip';
import { SearchIcon, CitizenIcon, FilterIcon, GuardIcon, PrisonerIcon } from './icons';

interface SearchInputProps {
  inputValue: string;
  onInputChange: (v: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  lockedType?: PersonType;
  allowedTypes?: PersonType[];
  typeFilter?: PersonType;
  onTypeFilterChange?: (type: PersonType | undefined) => void;
  activeOnly?: PersonLocatorProps['activeOnly'];
  isDefaultActive?: PersonLocatorProps['isDefaultActive'];
  minChars?: number;
  onActiveToggle?: (active: boolean) => void;
  activeToggleValue?: boolean;
  activeToggleLocked?: boolean;
  isOpen?: boolean;
  hasSelectedPerson?: boolean;
  isSearchActive?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  resultDirection?: 'up' | 'down';
  /** Lets PersonLocator treat the portaled filter menu as part of the control. */
  filterMenuRef: React.RefObject<HTMLDivElement>;
  /** Result count per type, shown in the compact filter menu. Missing types show no count. */
  typeCounts?: Partial<Record<PersonType, number>>;
  /** Reports switching between inline filters and the compact filter menu. */
  onCompactChange?: (isCompact: boolean) => void;
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface TypeMenuRowProps {
  label: string;
  ariaLabel: string;
  Icon?: React.ComponentType<{ size?: number }>;
  selected: boolean;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
}

/** One row in the compact filter menu: checkbox, icon, label and result count. */
const TypeMenuRow: React.FC<TypeMenuRowProps> = ({ label, ariaLabel, Icon, selected, count, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'plib-flex plib-items-center plib-gap-3 plib-w-full plib-px-4 plib-py-2 plib-border-0 plib-font-rubik plib-text-base plib-text-right plib-transition-colors',
      'focus-visible:plib-outline-none focus-visible:plib-ring-2 focus-visible:plib-ring-inset focus-visible:plib-ring-primary-main',
      selected ? 'plib-bg-primary-soft plib-text-primary-main plib-font-semibold' : 'plib-bg-transparent plib-text-text-primary hover:plib-bg-grey-50',
      disabled ? 'plib-cursor-not-allowed' : 'plib-cursor-pointer',
    ].join(' ')}
    aria-pressed={selected}
    aria-label={count !== undefined ? `${ariaLabel}, ${count} תוצאות` : ariaLabel}
  >
    <span
      className={[
        'plib-flex plib-items-center plib-justify-center plib-w-6 plib-h-6 plib-rounded-md plib-border-2 plib-border-solid plib-border-primary-main plib-flex-shrink-0 plib-transition-colors',
        selected ? 'plib-bg-primary-main plib-text-white' : 'plib-bg-white',
      ].join(' ')}
      aria-hidden="true"
    >
      {selected && <CheckIcon />}
    </span>
    <span
      className={`plib-flex plib-items-center plib-justify-center plib-w-7 plib-flex-shrink-0 plib-transition-colors ${selected ? 'plib-text-primary-main' : 'plib-text-primary-dark'}`}
      aria-hidden="true"
    >
      {Icon && <Icon size={28} />}
    </span>
    <span className="plib-flex-1">{label}</span>
    {count !== undefined && (
      <span
        className={[
          'plib-min-w-8 plib-h-6 plib-px-2 plib-rounded-full plib-flex plib-items-center plib-justify-center plib-text-xs plib-font-semibold plib-flex-shrink-0',
          selected ? 'plib-bg-white plib-text-primary-main' : 'plib-bg-grey-100 plib-text-text-secondary',
        ].join(' ')}
        aria-hidden="true"
      >
        {count}
      </span>
    )}
  </button>
);

// Pixel widths of the bar's parts, used to decide when the inline filters no longer fit.
const MIN_INPUT_WIDTH = 120; // 10 characters of 16px semibold Rubik, allowing for wide Hebrew letters
const BAR_FIXED_WIDTH = 34 + 28 + 25 + 9; // padding + border, search icon, clear button, divider
const ACTIVE_TOGGLE_WIDTH = 116;
const INNER_DIVIDER_WIDTH = 13;
const TYPE_BUTTON_WIDTH = 38;

const TYPE_CONFIG: {
  type: PersonType;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    type: 'asir',
    label: 'אסיר',
    Icon: PrisonerIcon,
    activeClass: 'plib-text-primary-dark plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-primary-dark plib-bg-transparent plib-rounded-lg plib-p-1',
  },
  {
    type: 'soher',
    label: 'סוהר',
    Icon: GuardIcon,
    activeClass: 'plib-text-primary-dark plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-primary-dark plib-bg-transparent plib-rounded-lg plib-p-1',
  },
  {
    type: 'ezrach',
    label: 'אזרח',
    Icon: CitizenIcon,
    activeClass: 'plib-text-primary-dark plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-primary-dark plib-bg-transparent plib-rounded-lg plib-p-1',
  },
];

const SearchInput: React.FC<SearchInputProps> = ({
  inputValue,
  onInputChange,
  onClear,
  onFocus,
  disabled,
  lockedType,
  allowedTypes,
  typeFilter,
  onTypeFilterChange,
  activeOnly,
  isDefaultActive,
  minChars = 3,
  onActiveToggle,
  activeToggleValue,
  activeToggleLocked = false,
  isOpen = false,
  hasSelectedPerson = false,
  isSearchActive = false,
  error = false,
  helperText,
  resultDirection = 'down',
  filterMenuRef,
  typeCounts = {},
  onCompactChange,
}) => {
  const helperId = useId();
  const [internalActive, setInternalActive] = useState(isDefaultActive ?? false);
  const isActive = activeToggleValue !== undefined ? activeToggleValue : internalActive;

  const handleToggle = (next: boolean) => {
    setInternalActive(next);
    onActiveToggle?.(next);
  };

  const handleTypeClick = (type: PersonType) => {
    onTypeFilterChange?.(typeFilter === type ? undefined : type);
  };

  const showFilters = (!hasSelectedPerson || isOpen) && isSearchActive;
  const showTypeButtons = showFilters && !lockedType;
  const showActiveToggle = showFilters && activeOnly === undefined;
  const visibleTypes = allowedTypes ? TYPE_CONFIG.filter(c => allowedTypes.includes(c.type)) : TYPE_CONFIG;

  const menuId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const [barWidth, setBarWidth] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    setBarWidth(bar.offsetWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setBarWidth(bar.offsetWidth));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // Measured against the filters that could appear, not those showing now, so the layout stays
  // the same whether or not the control is focused.
  const hasToggleFilter = activeOnly === undefined;
  const typeButtonCount = lockedType ? 0 : visibleTypes.length;
  const inlineFiltersWidth =
    (hasToggleFilter ? ACTIVE_TOGGLE_WIDTH : 0) +
    (hasToggleFilter && typeButtonCount > 0 ? INNER_DIVIDER_WIDTH : 0) +
    typeButtonCount * TYPE_BUTTON_WIDTH;
  const isCompact =
    inlineFiltersWidth > 0 &&
    barWidth > 0 && // 0 means not laid out yet (e.g. inside a hidden tab)
    barWidth < BAR_FIXED_WIDTH + MIN_INPUT_WIDTH + inlineFiltersWidth;

  const showMenuTrigger = isCompact && (showTypeButtons || showActiveToggle);
  const showInlineFilters = !isCompact && (showTypeButtons || showActiveToggle);
  const isMenuVisible = showMenuTrigger && isMenuOpen;

  useEffect(() => {
    onCompactChange?.(isCompact);
  }, [isCompact, onCompactChange]);

  // Otherwise a menu left open would reappear by itself when the control regains focus.
  useEffect(() => {
    if (!showMenuTrigger) setIsMenuOpen(false);
  }, [showMenuTrigger]);

  const appliedFilterCount = (typeFilter !== undefined ? 1 : 0) + (showActiveToggle && isActive ? 1 : 0);

  const visibleTypeCounts = visibleTypes.map((c) => typeCounts[c.type]);
  const allCount = visibleTypeCounts.every((n) => n !== undefined)
    ? visibleTypeCounts.reduce<number>((sum, n) => sum + (n ?? 0), 0)
    : undefined;

  return (
    <div className="plib-relative">
      {/* ── Single bar ──────────────────────────────────────────────────────── */}
      <div
        ref={barRef}
        className={[
          'plib-group/filters plib-flex plib-items-center plib-gap-2 plib-bg-white plib-px-4 plib-h-input plib-transition-all plib-border',
          isOpen
            ? 'plib-rounded-t-lg plib-rounded-b-none plib-shadow-search-top'
            : 'plib-rounded-lg',
          error ? 'plib-border-error-main' : 'plib-border-primary-main',
          disabled ? 'plib-opacity-60 plib-cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Search icon */}
        <SearchIcon className="plib-flex-shrink-0 plib-text-primary-dark" size={20} />

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          placeholder="חיפוש אדם"
          disabled={disabled}
          dir="rtl"
          className="plib-flex-1 plib-outline-none plib-text-right plib-font-rubik plib-font-semibold plib-text-base plib-text-text-primary placeholder:plib-text-text-muted plib-bg-transparent plib-min-w-0"
          aria-label="חיפוש אדם"
          aria-invalid={error || undefined}
          aria-describedby={helperText ? helperId : undefined}
        />

        {/* ── Clear ─────────────────────────────────────────────────────── */}
        {inputValue !== '' && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="plib-flex plib-items-center plib-justify-center plib-text-text-muted hover:plib-text-text-primary plib-transition-colors focus-visible:plib-ring-2 focus-visible:plib-ring-primary-main focus-visible:plib-outline-none plib-flex-shrink-0 plib-p-0.5"
            aria-label="נקה חיפוש"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* ── Active toggle + type filter icons — visible while focused ─── */}
        {/* ── Compact mode: filters move into a menu ────────────────────── */}
        {showMenuTrigger && (
          <>
            <div className="plib-w-px plib-h-6 plib-bg-divider plib-flex-shrink-0" aria-hidden="true" />
            <Tip label="סינון">
              <button
                ref={menuTriggerRef}
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={disabled}
                className={[
                  'plib-relative plib-flex plib-items-center plib-justify-center plib-flex-shrink-0 plib-w-8 plib-h-8 plib-rounded-lg plib-border-0 plib-text-primary-dark plib-transition-colors',
                  'focus-visible:plib-outline-none focus-visible:plib-ring-2 focus-visible:plib-ring-primary-main focus-visible:plib-ring-offset-1',
                  isMenuVisible ? 'plib-bg-primary-soft' : 'plib-bg-transparent hover:plib-bg-primary-soft',
                  disabled ? 'plib-cursor-not-allowed' : 'plib-cursor-pointer',
                ].join(' ')}
                aria-label={appliedFilterCount > 0 ? `סינון תוצאות, ${appliedFilterCount} סינונים פעילים` : 'סינון תוצאות'}
                aria-expanded={isMenuVisible}
                aria-controls={isMenuVisible ? menuId : undefined}
              >
                <FilterIcon size={20} />
                {appliedFilterCount > 0 && (
                  <span
                    className="plib-absolute -plib-top-1.5 -plib-right-1.5 plib-min-w-4.5 plib-h-4.5 plib-px-1 plib-rounded-full plib-bg-primary-main plib-text-white plib-text-2xs plib-font-semibold plib-leading-none plib-flex plib-items-center plib-justify-center plib-ring-2 plib-ring-white"
                    aria-hidden="true"
                  >
                    {appliedFilterCount}
                  </span>
                )}
              </button>
            </Tip>
            {isMenuVisible && (
              <FilterMenu
                id={menuId}
                anchorRef={menuTriggerRef}
                positionRef={barRef}
                menuRef={filterMenuRef}
                direction={resultDirection}
                onClose={closeMenu}
              >
                {showActiveToggle && (
                  <div className="plib-px-4 plib-pb-2">
                    <Toggle
                      checked={isActive}
                      onChange={handleToggle}
                      disabled={disabled || activeToggleLocked}
                    />
                  </div>
                )}
                {showTypeButtons && visibleTypes.length > 0 && (
                  <div role="group" aria-labelledby={`${menuId}-types`}>
                    <p
                      id={`${menuId}-types`}
                      className={`plib-m-0 plib-px-4 plib-pb-1 plib-font-rubik plib-text-sm plib-text-text-muted plib-text-right ${showActiveToggle ? 'plib-pt-2 plib-border-t plib-border-solid plib-border-0 plib-border-divider' : 'plib-pt-1'}`}
                    >
                      סוג אדם
                    </p>
                 
                    {visibleTypes.map(({ type, label, Icon }) => (
                      <TypeMenuRow
                        key={type}
                        label={label}
                        ariaLabel={`סנן לפי ${label}`}
                        Icon={Icon}
                        selected={typeFilter === type}
                        count={typeCounts[type]}
                        disabled={disabled}
                        onClick={() => handleTypeClick(type)}
                      />
                    ))}
                  </div>
                )}
              </FilterMenu>
            )}
          </>
        )}

        {showInlineFilters && (
          <>
            <div className="plib-w-px plib-h-6 plib-bg-divider plib-flex-shrink-0" aria-hidden="true" />
            <div className="plib-flex plib-items-center plib-gap-0.5 plib-flex-shrink-0">
              {/* ── Active toggle ─────────────────────────────────────────── */}
              {showActiveToggle && (
                <Toggle
                  checked={isActive}
                  onChange={handleToggle}
                  disabled={disabled || activeToggleLocked}
                />
              )}

              {showActiveToggle && showTypeButtons && visibleTypes.length > 0 && (
                <div className="plib-w-px plib-h-6 plib-bg-divider plib-flex-shrink-0 plib-mx-1" aria-hidden="true" />
              )}

              {/* ── Type filter icons ─────────────────────────────────────── */}
              {showTypeButtons && visibleTypes.map(({ type, label, Icon, activeClass, idleClass }) => {
                const isSelected = typeFilter === type;
                return (
                  <Tip key={type} label={label}>
                    <button
                      type="button"
                      onClick={() => handleTypeClick(type)}
                      disabled={disabled}
                      className={[
                        'plib-flex plib-items-center plib-justify-center plib-transition-all plib-flex-shrink-0',
                        'focus-visible:plib-outline-none focus-visible:plib-ring-2 focus-visible:plib-ring-primary-main focus-visible:plib-ring-offset-1',
                        isSelected ? activeClass : idleClass,
                        disabled ? 'plib-cursor-not-allowed' : 'plib-cursor-pointer',
                      ].join(' ')}
                      aria-pressed={isSelected}
                      aria-label={`סנן לפי ${label}`}
                    >
                      <Icon size={28} />
                    </button>
                  </Tip>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Hint — absolutely positioned so it never reserves layout space; showing/hiding it
          must not resize this container, since anchored portals (results/recents panels)
          measure this container's rect to position themselves. */}
      {helperText ? (
        <p
          id={helperId}
          className={[
            'plib-absolute plib-top-full plib-inset-x-0 plib-mt-1 plib-pointer-events-none',
            'plib-font-rubik plib-text-sm plib-text-right plib-px-1',
            error ? 'plib-text-error-main' : 'plib-text-text-muted',
          ].join(' ')}
          role={error ? 'alert' : 'status'}
          aria-live={error ? 'assertive' : 'polite'}
        >
          {helperText}
        </p>
      ) : inputValue.length > 0 && inputValue.length < minChars ? (
        <p
          className="plib-absolute plib-top-full plib-inset-x-0 plib-mt-1 plib-pointer-events-none plib-font-rubik plib-text-sm plib-text-text-muted plib-text-right plib-px-1"
          role="status"
          aria-live="polite"
        >
          הקלד לפחות {minChars} תווים לחיפוש
        </p>
      ) : null}
    </div>
  );
};

export default SearchInput;
