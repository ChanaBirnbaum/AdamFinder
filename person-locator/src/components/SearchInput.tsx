import React, { useState } from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
import Toggle from './Toggle';
import Tip from './Tooltip';
import { SearchIcon, CitizenIcon, GuardIcon, PrisonerIcon } from './icons';

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
  isOpen?: boolean;
  hasSelectedPerson?: boolean;
  isSearchActive?: boolean;
}

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
    activeClass: 'plib-text-primary-main plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-text-muted plib-bg-transparent plib-rounded-lg plib-p-1',
  },
  {
    type: 'soher',
    label: 'סוהר',
    Icon: GuardIcon,
    activeClass: 'plib-text-primary-main plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-text-muted plib-bg-transparent plib-rounded-lg plib-p-1',
  },
  {
    type: 'ezrach',
    label: 'אזרח',
    Icon: CitizenIcon,
    activeClass: 'plib-text-primary-main plib-bg-primary-soft plib-rounded-lg plib-p-0.5',
    idleClass:   'plib-text-text-muted plib-bg-transparent plib-rounded-lg plib-p-1',
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
  isOpen = false,
  hasSelectedPerson = false,
  isSearchActive = false,
}) => {
  const [internalActive, setInternalActive] = useState(isDefaultActive ?? false);
  const isActive = activeToggleValue !== undefined ? activeToggleValue : internalActive;

  const handleToggle = (next: boolean) => {
    setInternalActive(next);
    onActiveToggle?.(next);
  };

  const handleTypeClick = (type: PersonType) => {
    onTypeFilterChange?.(typeFilter === type ? undefined : type);
  };

  const showTypeButtons = !lockedType && (!hasSelectedPerson || isOpen) && isSearchActive;
  const visibleTypes = allowedTypes ? TYPE_CONFIG.filter(c => allowedTypes.includes(c.type)) : TYPE_CONFIG;

  return (
    <div className="plib-relative">
      {/* ── Single bar ──────────────────────────────────────────────────────── */}
      <div
        className={[
          'plib-group/filters plib-flex plib-items-center plib-gap-2 plib-bg-white plib-px-4 plib-h-input plib-transition-all',
          isOpen
            ? 'plib-rounded-t-lg plib-rounded-b-none plib-border-b-0 plib-border-2 plib-border-primary-main plib-shadow-search'
            : 'plib-rounded-lg plib-border plib-border-primary-main',
          disabled ? 'plib-opacity-60 plib-cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Search icon */}
        <SearchIcon className="plib-flex-shrink-0 plib-text-text-muted" size={20} />

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          placeholder="חיפוש אדם"
          disabled={disabled}
          dir="rtl"
          className="plib-flex-1 plib-outline-none plib-text-right plib-font-rubik plib-font-normal plib-text-base plib-text-text-primary placeholder:plib-text-text-muted plib-bg-transparent plib-min-w-0"
          aria-label="חיפוש אדם"
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
        {showTypeButtons && (
          <>
            <div className="plib-w-px plib-h-6 plib-bg-divider plib-flex-shrink-0" aria-hidden="true" />
            <div className="plib-flex plib-items-center plib-gap-0.5 plib-flex-shrink-0">
              {/* ── Active toggle ─────────────────────────────────────────── */}
              {activeOnly === undefined && (
                <Toggle
                  checked={isActive}
                  onChange={disabled ? undefined : handleToggle}
                  className={disabled ? 'plib-opacity-50 plib-pointer-events-none' : ''}
                />
              )}

              {activeOnly === undefined && visibleTypes.length > 0 && (
                <div className="plib-w-px plib-h-6 plib-bg-divider plib-flex-shrink-0 plib-mx-1" aria-hidden="true" />
              )}

              {/* ── Type filter icons ─────────────────────────────────────── */}
              {visibleTypes.map(({ type, label, Icon, activeClass, idleClass }) => {
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
      {inputValue.length > 0 && inputValue.length < minChars && (
        <p
          className="plib-absolute plib-top-full plib-inset-x-0 plib-mt-1 plib-pointer-events-none plib-font-rubik plib-text-sm plib-text-text-muted plib-text-right plib-px-1"
          role="status"
          aria-live="polite"
        >
          הקלד לפחות {minChars} תווים לחיפוש
        </p>
      )}
    </div>
  );
};

export default SearchInput;
