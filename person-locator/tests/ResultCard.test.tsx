import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ResultCard from '../src/components/ResultCard';
import type { PersonResult } from '../src/types';

const makePerson = (overrides: Partial<PersonResult> & { data?: Record<string, unknown> } = {}): PersonResult => {
  const { data: overrideData, ...rest } = overrides;
  return {
    id: '1',
    personType: 'ezrach',
    isActive: true,
    source: 'elasticsearch',
    data: { fullName: 'ישראל ישראלי', ...overrideData },
    ...rest,
  };
};

describe('ResultCard', () => {
  it('hides photo when person type is in HidePhotosSugAdam', () => {
    const person = makePerson({ personType: 'asir', data: { photoUrl: 'http://photo.jpg' } });
    render(
      <ResultCard
        person={person}
        query=""
        onSelect={vi.fn()}
        HidePhotosSugAdam={['asir']}
      />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows photo when person type is NOT in HidePhotosSugAdam', () => {
    const person = makePerson({ personType: 'ezrach', data: { photoUrl: 'http://photo.jpg' } });
    render(
      <ResultCard
        person={person}
        query=""
        onSelect={vi.fn()}
        HidePhotosSugAdam={['asir']}
      />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders "תיק אסיר" button only for prisoner type', () => {
    const prisoner = makePerson({ personType: 'asir' });
    const { rerender } = render(
      <ResultCard
        person={prisoner}
        query=""
        onSelect={vi.fn()}
        openTikAsir={vi.fn()}
      />
    );
    expect(screen.getByText('תיק אסיר')).toBeInTheDocument();

    const civilian = makePerson({ personType: 'ezrach' });
    rerender(
      <ResultCard
        person={civilian}
        query=""
        onSelect={vi.fn()}
        openTikAsir={vi.fn()}
      />
    );
    expect(screen.queryByText('תיק אסיר')).not.toBeInTheDocument();
  });

  it('hides navigation buttons when hideNavigationLinks is true', () => {
    const person = makePerson({ personType: 'asir' });
    render(
      <ResultCard
        person={person}
        query=""
        onSelect={vi.fn()}
        openTikAsir={vi.fn()}
        navigate={vi.fn()}
        hideNavigationLinks
      />
    );
    expect(screen.queryByText('תיק אסיר')).not.toBeInTheDocument();
  });

  it('shows matched text bolded (via strong element)', () => {
    const person = makePerson({ data: { fullName: 'ישראל ישראלי' } });
    render(
      <ResultCard
        person={person}
        query="ישראל"
        onSelect={vi.fn()}
      />
    );
    const bold = document.querySelectorAll('strong');
    expect(bold.length).toBeGreaterThan(0);
    expect(bold[0].textContent).toBe('ישראל');
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    const person = makePerson();
    render(<ResultCard person={person} query="" onSelect={onSelect} />);
    screen.getByRole('option').click();
    expect(onSelect).toHaveBeenCalledWith(person);
  });
});
