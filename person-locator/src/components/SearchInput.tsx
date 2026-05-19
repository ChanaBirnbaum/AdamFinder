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
}

// ── Better contextual icons ────────────────────────────────────────────────────
const PrisonerIcon = () => (
  // Person with bars in front
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="7" r="3" />
    <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
    <line x1="9"  y1="11" x2="9"  y2="21" strokeWidth="1.8" />
    <line x1="12" y1="10" x2="12" y2="21" strokeWidth="1.8" />
    <line x1="15" y1="11" x2="15" y2="21" strokeWidth="1.8" />
  </svg>
);

const GuardIcon = () => (
  // Badge/star shape – classic security badge
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.09 4.26L19 7.27l-3.5 3.41.83 4.82L12 13.27l-4.33 2.23.83-4.82L5 7.27l4.91-.71z" />
    <path d="M12 22V13" strokeWidth="1.5" />
    <path d="M5 10.5c0 5 3.13 8.5 7 9.5" strokeWidth="1.5" />
    <path d="M19 10.5c0 5-3.13 8.5-7 9.5" strokeWidth="1.5" />
  </svg>
);

const CivilianIcon = () => (
  // Person with ID card / briefcase feel
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="7" r="3.5" />
    <path d="M5.5 21v-1.5A5.5 5.5 0 0 1 11 14h2a5.5 5.5 0 0 1 5.5 5.5V21" />
    <rect x="9" y="3.5" width="6" height="2.5" rx="1" strokeWidth="1.5" />
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

  const showTypeButtons = !lockedType;
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

        {/* ── Active toggle + type filter icons — visible on hover ──────── */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover/filters:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex-shrink-0">

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
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1 rounded',
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  ].join(' ')}
                  aria-label="פעילים בלבד"
                >
                  <span
                    className={[
                      'relative inline-flex w-[28px] h-[15px] rounded-full overflow-hidden transition-colors duration-200 flex-shrink-0',
                      isActive ? 'bg-green-400' : 'bg-gray-300',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-[2px] h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-[left] duration-200',
                        isActive ? 'left-[15px]' : 'left-[2px]',
                      ].join(' ')}
                    />
                  </span>
                  <span dir="rtl" className={`text-[11px] font-medium transition-colors ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
                    פעיל
                  </span>
                </button>
              </>
            )}

            {/* ── Type filter icons ─────────────────────────────────────── */}
            {showTypeButtons && (
              <>
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
                          'flex items-center justify-center p-1 rounded transition-all flex-shrink-0',
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
              </>
            )}
          </div>
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
