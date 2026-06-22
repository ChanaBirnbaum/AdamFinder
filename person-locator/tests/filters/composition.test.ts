import { describe, it, expect } from 'vitest';
import { eq, and } from '../../src/filters/builder';
import { normalize, composeWithBase } from '../../src/filters/normalize';
import { compileToPredicate } from '../../src/filters/toPredicate';
import { makePerson } from './testFixtures';
import type { TestPerson } from './testFixtures';

describe('normalize', () => {
  it('undefined → and() — matches everything', () => {
    const pred = compileToPredicate(normalize<TestPerson>(undefined));
    expect(pred(makePerson({ id: '1' }))).toBe(true);
  });

  it('an array is treated as an implicit AND across entries', () => {
    const tree = normalize<TestPerson>([eq('isActive', true), eq('data.unit', 'A')]);
    expect(tree).toEqual(and<TestPerson>(eq('isActive', true), eq('data.unit', 'A')));

    const pred = compileToPredicate(tree);
    expect(pred(makePerson({ id: '1', isActive: true, data: { unit: 'A' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', isActive: true, data: { unit: 'B' } }))).toBe(false);
  });

  it('a single filter passes through unchanged', () => {
    const f = eq<TestPerson>('isActive', true);
    expect(normalize(f)).toBe(f);
  });
});

describe('composeWithBase', () => {
  it('the base filter is always ANDed in and cannot be widened past by the user filter', () => {
    // Base restricts to inactive only; user (deliberately, or maliciously) asks for active only.
    const base = eq<TestPerson>('isActive', false);
    const user = eq<TestPerson>('isActive', true);
    const tree = normalize(composeWithBase(base, user));
    const pred = compileToPredicate(tree);

    // No document can satisfy both isActive:false (base) and isActive:true (user).
    expect(pred(makePerson({ id: '1', isActive: true }))).toBe(false);
    expect(pred(makePerson({ id: '2', isActive: false }))).toBe(false);
  });

  it('an undefined user filter still enforces the base filter', () => {
    const base = eq<TestPerson>('isActive', true);
    const tree = normalize(composeWithBase(base, undefined));
    const pred = compileToPredicate(tree);

    expect(pred(makePerson({ id: '1', isActive: true }))).toBe(true);
    expect(pred(makePerson({ id: '2', isActive: false }))).toBe(false);
  });

  it('an undefined base filter leaves the user filter as the sole constraint', () => {
    const user = eq<TestPerson>('data.unit', 'A');
    const tree = normalize(composeWithBase(undefined, user));
    const pred = compileToPredicate(tree);

    expect(pred(makePerson({ id: '1', data: { unit: 'A' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { unit: 'B' } }))).toBe(false);
  });
});
