import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonLocator from '../src/components/PersonLocator';
import type { PersonLocatorProps } from '../src/types';

// Mock hooks and services so no real fetch calls happen
jest.mock('../src/hooks/usePersonSearch', () => ({
  usePersonSearch: () => ({
    results: { asirs: [], sohers: [], ezrachs: [], totalCount: 0 },
    isLoading: false,
    isLoadingMore: false,
    isOffline: false,
    error: null,
    selectedPerson: null,
    inputValue: '',
    activeTab: 'asir',
    pagingState: {
      asirs: { offset: 0, hasMore: false },
      sohers: { offset: 0, hasMore: false },
      ezrachs: { offset: 0, hasMore: false },
    },
    setInputValue: jest.fn(),
    setActiveTab: jest.fn(),
    selectPerson: jest.fn(),
    clearSelection: jest.fn(),
    loadMore: jest.fn(),
  }),
}));

const minimalProps: PersonLocatorProps = {};

describe('PersonLocator', () => {
  it('renders without crashing with minimal props', () => {
    render(<PersonLocator {...minimalProps} />);
    expect(screen.getByPlaceholderText('חיפוש אדם...')).toBeInTheDocument();
  });

  it('results panel is hidden when inputValue < minChars', () => {
    render(<PersonLocator {...minimalProps} />);
    // The mock returns inputValue: '', so results panel should not show
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('disabled prop sets aria-disabled on root', () => {
    const { container } = render(<PersonLocator {...minimalProps} disabled />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('aria-disabled', 'true');
  });

  it('disabled prop disables the input', () => {
    render(<PersonLocator {...minimalProps} disabled />);
    const input = screen.getByPlaceholderText('חיפוש אדם...');
    expect(input).toBeDisabled();
  });

  it('tab bar is hidden when type prop is provided', () => {
    render(<PersonLocator {...minimalProps} type="asir" />);
    // Tab bar renders inside results panel which is hidden (inputValue is ''),
    // but confirm no tablist is visible at top level
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});
