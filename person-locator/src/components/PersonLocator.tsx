import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PersonLocatorProps, PersonType } from '../types';
import { usePersonSearch } from '../hooks/usePersonSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';

import SearchInput from './SearchInput';
import ResultsPanel from './ResultsPanel';
import RecentSearchesPanel from './RecentSearchesPanel';

const PersonLocator: React.FC<PersonLocatorProps> = (props) => {
  const {
    type,
    disabled,
    resultDirection = 'down',
    minChars = 3,
    openTikAsir,
    navigate,
    HidePhotosSugAdam,
    HideMishmorot,
    hideNavigationLinks,
    activeOnly,
    isDefaultActive,
  } = props;

  const [internalTypeFilter, setInternalTypeFilter] = useState<PersonType | undefined>(undefined);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Normalize type to single value for UI locking (tab bar, filter icon)
  // When multiple types passed, treat as "no lock" for UI purposes
  const lockedType: PersonType | undefined = Array.isArray(type)
    ? (type.length === 1 ? type[0] : undefined)
    : type;

  // allowedTypes: the set of types the user is allowed to search/filter by
  const allowedTypes: PersonType[] | undefined = Array.isArray(type)
    ? (type.length > 1 ? type : undefined)
    : undefined;

  // In multi-type mode: use internalTypeFilter (single type) when selected, else fall back to the full array
  // In single/no-type mode: use type prop if given, else internalTypeFilter
  const effectiveType = allowedTypes
    ? (internalTypeFilter ?? type)
    : (type ?? internalTypeFilter);
  const effectiveProps = { ...props, type: effectiveType };

  const {
    results,
    isLoading,
    isLoadingMore,
    isOffline,
    error,
    selectedPerson,
    inputValue,
    activeTab,
    setInputValue,
    setActiveTab,
    selectPerson,
    clearSelection,
    loadMore,
    showActiveOnly,
    setShowActiveOnly,
    displayFields,
  } = usePersonSearch(effectiveProps);

  const { recents, addPerson, removePerson, clearAll } = useRecentSearches();

  const filteredRecents = Array.isArray(effectiveType)
    ? recents.filter((r) => (effectiveType as PersonType[]).includes(r.personType))
    : effectiveType
    ? recents.filter((r) => r.personType === effectiveType)
    : recents;

  const showResults = isFocused && (selectedPerson !== null || inputValue.length >= minChars);
  const showRecents = isFocused && !showResults && filteredRecents.length > 0;
  const isOpen = showResults || showRecents;
  const showTabBar = !lockedType;

  const handleSelect = useCallback((person: Parameters<typeof selectPerson>[0]) => {
    addPerson({ id: person.id, fullName: String(person.data['fullName'] ?? ''), personType: person.personType });
    selectPerson(person);
    setIsFocused(false);
  }, [addPerson, selectPerson]);

  const handleRecentSelect = useCallback((recent: { fullName: string }) => {
    setInputValue(recent.fullName);
    setIsFocused(false);
  }, [setInputValue]);

  const selectedOnlyResults: typeof results = selectedPerson
    ? {
        asirs: selectedPerson.personType === 'asir' ? [selectedPerson] : [],
        sohers: selectedPerson.personType === 'soher' ? [selectedPerson] : [],
        ezrachs: selectedPerson.personType === 'ezrach' ? [selectedPerson] : [],
        totalsByType: {
          asir: selectedPerson.personType === 'asir' ? 1 : 0,
          soher: selectedPerson.personType === 'soher' ? 1 : 0,
          ezrach: selectedPerson.personType === 'ezrach' ? 1 : 0,
        },
        totalCount: 1,
      }
    : results;

  return (
    <div
      ref={containerRef}
      className="relative w-full font-sans"
      dir="rtl"
      aria-disabled={disabled}
      style={disabled ? { pointerEvents: 'none' } : undefined}
     onFocusCapture={() => setIsFocused(true)}
onBlurCapture={() => {
        // Ensure focus remains active during scrolling or internal interactions
        requestAnimationFrame(() => {
          if (
            containerRef.current &&
            (!containerRef.current.contains(document.activeElement) || document.activeElement === document.body)
          ) {
            setIsFocused(false);
          }
        });
      }}
    >
      <SearchInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onClear={clearSelection}
        onFocus={() => setIsFocused(true)}
        disabled={disabled}
        lockedType={lockedType}
        allowedTypes={allowedTypes}
        typeFilter={internalTypeFilter}
        onTypeFilterChange={setInternalTypeFilter}
        activeOnly={activeOnly}
        isDefaultActive={isDefaultActive}
        minChars={minChars}
        isOpen={isOpen}
        hasSelectedPerson={selectedPerson !== null}
        isSearchActive={isFocused && selectedPerson === null}
        activeToggleValue={showActiveOnly}
        onActiveToggle={setShowActiveOnly}
      />

      {error && (
        <div className="mt-1 text-xs text-red-600 text-right" role="alert" aria-live="assertive">
          {error}
          <button
            type="button"
            onClick={() => setInputValue(inputValue)}
            className="mr-2 underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            aria-label="נסה שוב"
          >
            נסה שוב
          </button>
        </div>
      )}

      {showResults && (
        <ResultsPanel
          results={selectedOnlyResults}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          isOffline={isOffline}
          activeTab={activeTab}
          query={inputValue}
          resultDirection={resultDirection}
          showTabBar={showTabBar}
          allowedTypes={allowedTypes}
          onTabChange={setActiveTab}
          onSelect={handleSelect}
          loadMore={loadMore}
          openTikAsir={openTikAsir}
          navigate={navigate}
          HidePhotosSugAdam={HidePhotosSugAdam}
          HideMishmorot={HideMishmorot}
          hideNavigationLinks={hideNavigationLinks}
          additionalResultFields={displayFields}
        />
      )}

      {showRecents && !showResults && (
        <RecentSearchesPanel
          recents={filteredRecents}
          onSelect={handleRecentSelect}
          onRemove={removePerson}
          onClearAll={clearAll}
          resultDirection={resultDirection}
        />
      )}
    </div>
  );
};

export default PersonLocator;
