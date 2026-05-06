import React, { useCallback, useRef } from 'react';
import type { PersonLocatorProps, PersonResult, PersonType, SearchResults } from '../types';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import TabBar from './TabBar';
import ResultCard from './ResultCard';
import SkeletonCard from './SkeletonCard';
import OfflineBanner from './OfflineBanner';
import EmptyState from './EmptyState';

interface ResultsPanelProps {
  results: SearchResults;
  isLoading: boolean;
  isLoadingMore: boolean;
  isOffline: boolean;
  activeTab: PersonType;
  query: string;
  resultDirection?: 'up' | 'down';
  showTabBar: boolean;
  onTabChange: (tab: PersonType) => void;
  onSelect: (person: PersonResult) => void;
  loadMore: (tab: PersonType) => void;
  openTikAsir?: PersonLocatorProps['openTikAsir'];
  navigate?: PersonLocatorProps['navigate'];
  HidePhotosSugAdam?: PersonLocatorProps['HidePhotosSugAdam'];
  HideMishmorot?: PersonLocatorProps['HideMishmorot'];
  hideNavigationLinks?: PersonLocatorProps['hideNavigationLinks'];
  additionalResultFields?: string[];
}

const RESULTS_MAP: Record<PersonType, keyof SearchResults> = {
  asir: 'asirs',
  soher: 'sohers',
  ezrach: 'ezrachs',
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  isLoading,
  isLoadingMore,
  isOffline,
  activeTab,
  query,
  resultDirection = 'down',
  showTabBar,
  onTabChange,
  onSelect,
  loadMore,
  openTikAsir,
  navigate,
  HidePhotosSugAdam,
  HideMishmorot,
  hideNavigationLinks,
  additionalResultFields = [],
}) => {
  const panelClass =
    resultDirection === 'up'
      ? 'absolute bottom-full w-full z-50 bg-white rounded-t-xl shadow-lg max-h-64 flex flex-col border border-b-0 border-gray-200'
      : 'absolute top-full w-full z-50 bg-white rounded-b-xl shadow-lg max-h-64 flex flex-col border border-t-0 border-gray-200';

  const scrollClass = 'flex-1 overflow-y-auto';

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeResults = results[RESULTS_MAP[activeTab]] as PersonResult[];
  const handleLoadMore = useCallback(() => loadMore(activeTab), [loadMore, activeTab]);
  const lastCardRef = useInfiniteScroll(
    handleLoadMore,
    !isLoading && !isLoadingMore,
    scrollRef,
  );

  return (
    <div className={panelClass} role="listbox" aria-label="תוצאות חיפוש">
      {isOffline && <OfflineBanner />}

      {showTabBar && (
        <TabBar
          results={results}
          activeTab={activeTab}
          isLoading={isLoading}
          onTabChange={onTabChange}
        />
      )}

      <div ref={scrollRef} className={scrollClass}>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : results.totalCount === 0 ? (
          <EmptyState />
        ) : (
          <div
            id={`panel-${activeTab}`}
            role="group"
            aria-label={activeTab}
          >
            {activeResults.map((person, idx) => (
              <ResultCard
                key={person.id}
                person={person}
                query={query}
                isLast={idx === activeResults.length - 1}
                lastRef={lastCardRef}
                onSelect={onSelect}
                openTikAsir={openTikAsir}
                navigate={navigate}
                HidePhotosSugAdam={HidePhotosSugAdam}
                HideMishmorot={HideMishmorot}
                hideNavigationLinks={hideNavigationLinks}
                additionalResultFields={additionalResultFields}
              />
            ))}
            {isLoadingMore && <SkeletonCard />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
