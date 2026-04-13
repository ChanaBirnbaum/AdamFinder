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
    additionalResultFields = [],
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

  const effectiveType = type ?? internalTypeFilter;
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
  } = usePersonSearch(effectiveProps);

  const { recents, addPerson, removePerson, clearAll } = useRecentSearches();

  const filteredRecents = effectiveType
    ? recents.filter((r) => r.personType === effectiveType)
    : recents;

  const showResults = isFocused && (selectedPerson !== null || inputValue.length >= minChars);
  const showRecents = isFocused && !showResults && filteredRecents.length > 0;
  const isOpen = showResults || showRecents;
  const showTabBar = !effectiveType;

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
      onBlur={(e) => {
        // only blur when focus leaves the whole component
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
    >
      <SearchInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onClear={clearSelection}
        onFocus={() => setIsFocused(true)}
        disabled={disabled}
        lockedType={type}
        typeFilter={internalTypeFilter}
        onTypeFilterChange={setInternalTypeFilter}
        activeOnly={activeOnly}
        isDefaultActive={isDefaultActive}
        minChars={minChars}
        isOpen={isOpen}
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
          onTabChange={setActiveTab}
          onSelect={handleSelect}
          loadMore={loadMore}
          openTikAsir={openTikAsir}
          navigate={navigate}
          HidePhotosSugAdam={HidePhotosSugAdam}
          HideMishmorot={HideMishmorot}
          hideNavigationLinks={hideNavigationLinks}
          additionalResultFields={additionalResultFields}
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
