import React, { useState } from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
import Toggle from './Toggle';
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

// ── Tooltip wrapper ────────────────────────────────────────────────────────────
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
    activeClass: 'text-primary-main bg-primary-soft rounded-lg p-0.5 w-8 h-8 box-border',
    idleClass:   'text-text-muted bg-transparent rounded-lg p-1',
  },
  {
    type: 'soher',
    label: 'סוהר',
    Icon: GuardIcon,
    activeClass: 'text-primary-main bg-primary-soft rounded-lg p-0.5 w-8 h-8 box-border',
    idleClass:   'text-text-muted bg-transparent rounded-lg p-1',
  },
  {
    type: 'ezrach',
    label: 'אזרח',
    Icon: CitizenIcon,
    activeClass: 'text-primary-main bg-primary-soft rounded-lg p-0.5 w-8 h-8 box-border',
    idleClass:   'text-text-muted bg-transparent rounded-lg p-1',
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
    <div className="space-y-1">
      {/* ── Single bar ──────────────────────────────────────────────────────── */}
      <div
        className={[
          'group/filters flex items-center gap-2 bg-white px-4 h-input transition-all',
          isOpen
            ? 'rounded-t-lg rounded-b-none border-b-0 border-2 border-primary-main shadow-search'
            : 'rounded-lg border border-primary-main',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Search icon */}
        <SearchIcon className="flex-shrink-0 text-text-muted" size={20} />

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          placeholder="חיפוש אדם"
          disabled={disabled}
          dir="rtl"
          className="flex-1 outline-none text-right font-rubik font-normal text-base text-text-primary placeholder:text-text-muted bg-transparent min-w-0"
          aria-label="חיפוש אדם"
        />

        {/* ── Clear ─────────────────────────────────────────────────────── */}
        {inputValue !== '' && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="flex items-center justify-center text-text-muted hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:outline-none flex-shrink-0 p-0.5"
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
          <div className="flex items-center gap-0.5 flex-shrink-0">

            {/* ── Active toggle ─────────────────────────────────────────── */}
            {activeOnly === undefined && (
              <Toggle
                checked={isActive}
                onChange={disabled ? undefined : handleToggle}
                className={disabled ? 'opacity-50 pointer-events-none' : ''}
              />
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
                      'flex items-center justify-center transition-all flex-shrink-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-1',
                      isSelected ? activeClass : idleClass,
                      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
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
        )}
      </div>

      {/* Hint */}
      {inputValue.length > 0 && inputValue.length < minChars && (
        <p className="font-rubik text-sm text-text-muted text-right px-1" role="status" aria-live="polite">
          הקלד לפחות {minChars} תווים לחיפוש
        </p>
      )}
    </div>
  );
};

export default SearchInput;
