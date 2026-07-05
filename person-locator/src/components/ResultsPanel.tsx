import React, { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PersonLocatorProps, PersonResult, PersonType, SearchResults } from '../types';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useAnchoredPosition } from '../hooks/useAnchoredPosition';
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
  allowedTypes?: PersonType[];
  onTabChange: (tab: PersonType) => void;
  onSelect: (person: PersonResult) => void;
  loadMore: (tab: PersonType) => void;
  openTikAsir?: PersonLocatorProps['openTikAsir'];
  navigate?: PersonLocatorProps['navigate'];
  HidePhotosSugAdam?: PersonLocatorProps['HidePhotosSugAdam'];
  displayIdNumber?: PersonLocatorProps['displayIdNumber'];
  HideMishmorot?: PersonLocatorProps['HideMishmorot'];
  hideNavigationLinks?: PersonLocatorProps['hideNavigationLinks'];
  additionalResultFields?: string[];
  /** Element the panel should be positioned under/over. Required to portal the panel out of clipping ancestors. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

const RESULTS_MAP: Record<PersonType, keyof SearchResults> = {
  asir: 'asirs',
  soher: 'sohers',
  ezrach: 'ezrachs',
};

const ResultsPanel = React.forwardRef<HTMLDivElement, ResultsPanelProps>(({
  results,
  isLoading,
  isLoadingMore,
  isOffline,
  activeTab,
  query,
  resultDirection = 'down',
  showTabBar,
  allowedTypes,
  onTabChange,
  onSelect,
  loadMore,
  openTikAsir,
  navigate,
  HidePhotosSugAdam,
  displayIdNumber,
  HideMishmorot,
  hideNavigationLinks,
  additionalResultFields = [],
  anchorRef,
}, forwardedRef) => {
  const panelClass =
    resultDirection === 'up'
      ? 'z-50 bg-white rounded-t-xl shadow-lg max-h-64 flex flex-col border border-b-0 border-gray-200'
      : 'z-50 bg-white rounded-b-xl shadow-lg max-h-64 flex flex-col border border-t-0 border-gray-200';

  const scrollClass = 'flex-1 overflow-y-auto';

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeResults = results[RESULTS_MAP[activeTab]] as PersonResult[];
  const handleLoadMore = useCallback(() => loadMore(activeTab), [loadMore, activeTab]);
  const lastCardRef = useInfiniteScroll(
    handleLoadMore,
    !isLoading && !isLoadingMore,
    scrollRef,
  );

  // Panel is portaled to <body>, so it needs its own fixed-position coordinates
  // pinned to the anchor element instead of relying on a relative-positioned parent.
  const panelStyle = useAnchoredPosition(anchorRef, resultDirection);

  return createPortal(
    // Portaled straight to <body>, so it no longer inherits dir="rtl" from PersonLocator's
    // root container — set it explicitly or the whole layout mirrors to LTR.
    <div ref={forwardedRef} className={panelClass} style={panelStyle} role="listbox" aria-label="תוצאות חיפוש" dir="rtl">
      {isOffline && <OfflineBanner />}

      {showTabBar && (
        <TabBar
          results={results}
          activeTab={activeTab}
          isLoading={isLoading}
          allowedTypes={allowedTypes}
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
                displayIdNumber={displayIdNumber}
                HideMishmorot={HideMishmorot}
                hideNavigationLinks={hideNavigationLinks}
                additionalResultFields={additionalResultFields}
              />
            ))}
            {isLoadingMore && <SkeletonCard />}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
});

ResultsPanel.displayName = 'ResultsPanel';

export default ResultsPanel;
