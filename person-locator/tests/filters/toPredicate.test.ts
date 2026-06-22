import { describe, it, expect } from 'vitest';
import { eq, oneOf, noneOf, range, and, or, not, exists } from '../../src/filters/builder';
import { compileToPredicate } from '../../src/filters/toPredicate';
import { makePerson } from './testFixtures';
import type { TestPerson } from './testFixtures';

describe('compileToPredicate', () => {
  it('eq matches an exact field value', () => {
    const pred = compileToPredicate(eq<TestPerson>('data.unit', 'A'));
    expect(pred(makePerson({ id: '1', data: { unit: 'A' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { unit: 'B' } }))).toBe(false);
  });

  it('eq loosely coerces number vs string (id-type mismatch)', () => {
    const pred = compileToPredicate(eq<TestPerson>('data.idNumber', 123 as unknown as string));
    expect(pred(makePerson({ id: '1', data: { idNumber: '123' } }))).toBe(true);
  });

  it('in (oneOf) matches any of the given values', () => {
    const pred = compileToPredicate(oneOf<TestPerson>('data.unit', ['A', 'B']));
    expect(pred(makePerson({ id: '1', data: { unit: 'B' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { unit: 'C' } }))).toBe(false);
  });

  it('nin (noneOf) excludes any of the given values', () => {
    const pred = compileToPredicate(noneOf<TestPerson>('data.idNumber', ['1', '2']));
    expect(pred(makePerson({ id: '1', data: { idNumber: '3' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { idNumber: '1' } }))).toBe(false);
  });

  it('range matches values within bounds', () => {
    const pred = compileToPredicate(range<TestPerson>('data.rank', { gte: 2, lte: 5 }));
    expect(pred(makePerson({ id: '1', data: { rank: 3 } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { rank: 10 } }))).toBe(false);
  });

  it('exists checks presence, treats empty arrays as absent', () => {
    const pred = compileToPredicate(exists<TestPerson>('data.phone'));
    expect(pred(makePerson({ id: '1', data: { phone: '050' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: {} }))).toBe(false);
  });

  it('array-valued fields match if ANY element matches', () => {
    const person = makePerson({ id: '1', data: { tags: ['x', 'y'] } });
    expect(compileToPredicate(eq<TestPerson>('data.tags', 'y' as unknown as never))(person)).toBe(true);
    expect(compileToPredicate(oneOf<TestPerson>('data.tags', ['z', 'y'] as unknown as never[]))(person)).toBe(true);
    expect(compileToPredicate(eq<TestPerson>('data.tags', 'z' as unknown as never))(person)).toBe(false);
  });

  it('and requires every sub-filter to match', () => {
    const pred = compileToPredicate(
      and<TestPerson>(eq('isActive', true), eq('data.unit', 'A')),
    );
    expect(pred(makePerson({ id: '1', isActive: true, data: { unit: 'A' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', isActive: false, data: { unit: 'A' } }))).toBe(false);
  });

  it('or requires at least one sub-filter to match', () => {
    const pred = compileToPredicate(or<TestPerson>(eq('data.unit', 'A'), eq('data.unit', 'B')));
    expect(pred(makePerson({ id: '1', data: { unit: 'B' } }))).toBe(true);
    expect(pred(makePerson({ id: '2', data: { unit: 'C' } }))).toBe(false);
  });

  it('not negates the inner filter', () => {
    const pred = compileToPredicate(not<TestPerson>(eq('isActive', true)));
    expect(pred(makePerson({ id: '1', isActive: false }))).toBe(true);
    expect(pred(makePerson({ id: '2', isActive: true }))).toBe(false);
  });
});
