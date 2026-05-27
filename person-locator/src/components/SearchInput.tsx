import React, { useState } from 'react';
import type { PersonLocatorProps, PersonType } from '../types';

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

// ── Contextual icons ───────────────────────────────────────────────────────────
const PrisonerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 17V25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 17L15 25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 17L17 25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 17V25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GuardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6667 6H13.3333C12.597 6 12 6.59695 12 7.33333V8C12 8.73638 12.597 9.33333 13.3333 9.33333H18.6667C19.403 9.33333 20 8.73638 20 8V7.33333C20 6.59695 19.403 6 18.6667 6Z" fill="currentColor"/>
  </svg>
);

const CivilianIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M12 11C12 12.0609 12.4214 13.0783 13.1716 13.8284C13.9217 14.5786 14.9391 15 16 15C17.0609 15 18.0783 14.5786 18.8284 13.8284C19.5786 13.0783 20 12.0609 20 11C20 9.93913 19.5786 8.92172 18.8284 8.17157C18.0783 7.42143 17.0609 7 16 7C14.9391 7 13.9217 7.42143 13.1716 8.17157C12.4214 8.92172 12 9.93913 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 25V23C10 21.9391 10.4214 20.9217 11.1716 20.1716C11.9217 19.4214 12.9391 19 14 19H18C19.0609 19 20.0783 19.4214 20.8284 20.1716C21.5786 20.9217 22 21.9391 22 23V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TYPE_CONFIG: {
  type: PersonType;
  label: string;
  Icon: React.FC;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    type: 'asir',
    label: 'אסיר',
    Icon: PrisonerIcon,
    activeClass: 'text-rose-500',
    idleClass:   'text-gray-300 hover:text-rose-400',
  },
  {
    type: 'soher',
    label: 'סוהר',
    Icon: GuardIcon,
    activeClass: 'text-blue-500',
    idleClass:   'text-gray-300 hover:text-blue-400',
  },
  {
    type: 'ezrach',
    label: 'אזרח',
    Icon: CivilianIcon,
    activeClass: 'text-emerald-500',
    idleClass:   'text-gray-300 hover:text-emerald-400',
  },
];

// ── Tooltip wrapper ────────────────────────────────────────────────────────────
const Tip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="relative group flex items-center">
    {children}
    <div
      className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg"
      role="tooltip"
    >
      {label}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
    </div>
  </div>
);

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

  const handleToggle = () => {
    const next = !isActive;
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
          'group/filters flex items-center gap-1.5 border bg-white px-3 h-10 transition-all',
          isOpen ? 'rounded-t-xl rounded-b-none border-b-0' : 'rounded-xl shadow-sm',
          disabled
            ? 'border-gray-200 opacity-60 cursor-not-allowed'
            : 'border-gray-200 focus-within:border-blue-300',
        ].join(' ')}
      >
        {/* Search icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          placeholder="חיפוש אדם..."
          disabled={disabled}
          dir="rtl"
          className="flex-1 outline-none text-right text-sm text-gray-800 placeholder-gray-400 bg-transparent min-w-0"
          aria-label="חיפוש אדם"
        />

        {/* ── Clear ─────────────────────────────────────────────────────── */}
        {inputValue !== '' && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none flex-shrink-0 p-0.5"
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
              <>
                <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden="true" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={handleToggle}
                  disabled={disabled}
                  dir="ltr"
                  className={[
                    'flex items-center gap-1.5 flex-shrink-0 select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 rounded',
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  ].join(' ')}
                  aria-label="פעילים בלבד"
                >
                  <span
                    className={[
                      'relative inline-flex w-[34px] h-[18px] rounded-full overflow-hidden transition-colors duration-200 flex-shrink-0',
                      isActive ? 'bg-blue-500' : 'bg-gray-300',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-[3px] h-[12px] w-[12px] rounded-full bg-white shadow-sm transition-[left] duration-200',
                        isActive ? 'left-[19px]' : 'left-[3px]',
                      ].join(' ')}
                    />
                  </span>
                  <span dir="rtl" className={`text-[11px] font-medium transition-colors ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                    פעיל
                  </span>
                </button>
              </>
            )}

            {/* ── Type filter icons ─────────────────────────────────────── */}
            <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden="true" />

            {visibleTypes.map(({ type, label, Icon, activeClass, idleClass }) => {
              const isSelected = typeFilter === type;
              return (
                <Tip key={type} label={label}>
                  <button
                    type="button"
                    onClick={() => handleTypeClick(type)}
                    disabled={disabled}
                    className={[
                      'flex items-center justify-center p-0.5 rounded transition-all flex-shrink-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                      isSelected ? activeClass : idleClass,
                      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                    aria-pressed={isSelected}
                    aria-label={`סנן לפי ${label}`}
                  >
                    <Icon />
                  </button>
                </Tip>
              );
            })}
          </div>
        )}
      </div>

      {/* Hint */}
      {inputValue.length > 0 && inputValue.length < minChars && (
        <p className="text-xs text-gray-400 text-right px-1" role="status" aria-live="polite">
          הקלד לפחות {minChars} תווים לחיפוש
        </p>
      )}
    </div>
  );
};

export default SearchInput;
