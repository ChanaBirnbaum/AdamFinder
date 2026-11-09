import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import SearchInput from '../src/components/SearchInput';

describe('SearchInput', () => {
  const baseProps = {
    inputValue: 'ישראל',
    onInputChange: vi.fn(),
    onClear: vi.fn(),
    onFocus: vi.fn(),
    isSearchActive: true,
    filterMenuRef: React.createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement>,
  };

  afterEach(() => vi.restoreAllMocks());

  const mockBarWidth = (width: number) =>
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);

  it('keeps filters inline when they leave room for 10 characters', () => {
    mockBarWidth(600);
    render(<SearchInput {...baseProps} />);

    expect(screen.getByLabelText('סנן לפי אסיר')).toBeInTheDocument();
    expect(screen.queryByLabelText(/סינון תוצאות/)).not.toBeInTheDocument();
  });

  it('moves filters into a menu when the bar is too narrow', () => {
    mockBarWidth(300);
    const onTypeFilterChange = vi.fn();
    render(<SearchInput {...baseProps} onTypeFilterChange={onTypeFilterChange} />);

    expect(screen.queryByLabelText('סנן לפי אסיר')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/סינון תוצאות/));
    fireEvent.click(screen.getByLabelText('סנן לפי אסיר'));
    expect(onTypeFilterChange).toHaveBeenCalledWith('asir');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('סנן לפי אסיר')).not.toBeInTheDocument();
  });

  it('renders filter controls while search is active', () => {
    render(<SearchInput {...baseProps} />);

    expect(screen.getByLabelText('סנן לפי אסיר')).toBeInTheDocument();
    expect(screen.getByLabelText('סנן לפי סוהר')).toBeInTheDocument();
    expect(screen.getByLabelText('סנן לפי אזרח')).toBeInTheDocument();
  });

  it('hides filter controls after a person is selected', () => {
    const { rerender } = render(<SearchInput {...baseProps} hasSelectedPerson />);

    expect(screen.queryByLabelText('סנן לפי אסיר')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('סנן לפי סוהר')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('סנן לפי אזרח')).not.toBeInTheDocument();

    rerender(<SearchInput {...baseProps} hasSelectedPerson={false} isSearchActive={false} />);
    expect(screen.queryByLabelText('סנן לפי אסיר')).not.toBeInTheDocument();
  });
});
