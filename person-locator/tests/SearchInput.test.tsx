import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchInput from '../src/components/SearchInput';

describe('SearchInput', () => {
  const baseProps = {
    inputValue: 'ישראל',
    onInputChange: vi.fn(),
    onClear: vi.fn(),
    onFocus: vi.fn(),
    isSearchActive: true,
  };

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
