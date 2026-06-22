import { describe, it, expect } from 'vitest';
import { eq, oneOf, noneOf, range, exists } from '../../src/filters/builder';
import { compileToPredicate } from '../../src/filters/toPredicate';
import { makePerson } from './testFixtures';
import type { TestPerson } from './testFixtures';

/**
 * The field exists in Elasticsearch but is absent on the synced object (online/offline).
 * The predicate must mirror Elasticsearch's `filter`-context behavior exactly:
 *   eq / in / range / exists → exclude (false)
 *   nin                      → include (true)
 */
describe('compileToPredicate — missing-field semantics', () => {
  const personWithoutField = makePerson({ id: '1', data: {} });

  it('eq on a missing field excludes the document', () => {
    expect(compileToPredicate(eq<TestPerson>('data.unit', 'A'))(personWithoutField)).toBe(false);
  });

  it('in (oneOf) on a missing field excludes the document', () => {
    expect(compileToPredicate(oneOf<TestPerson>('data.unit', ['A', 'B']))(personWithoutField)).toBe(false);
  });

  it('range on a missing field excludes the document', () => {
    expect(compileToPredicate(range<TestPerson>('data.rank', { gte: 1 }))(personWithoutField)).toBe(false);
  });

  it('exists on a missing field excludes the document', () => {
    expect(compileToPredicate(exists<TestPerson>('data.phone'))(personWithoutField)).toBe(false);
  });

  it('nin (noneOf) on a missing field includes the document', () => {
    expect(compileToPredicate(noneOf<TestPerson>('data.idNumber', ['1', '2']))(personWithoutField)).toBe(true);
  });
});
