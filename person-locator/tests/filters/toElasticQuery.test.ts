import { describe, it, expect } from 'vitest';
import { eq, oneOf, noneOf, range, and, or, not, exists } from '../../src/filters/builder';
import { compileToElasticQuery, MAX_INLINE_TERMS } from '../../src/filters/toElasticQuery';
import type { TestPerson } from './testFixtures';

describe('compileToElasticQuery', () => {
  it('eq → term, appends .keyword for string values', () => {
    const clause = compileToElasticQuery(eq<TestPerson>('data.unit', 'A'));
    expect(clause).toEqual({ term: { 'data.unit.keyword': 'A' } });
  });

  it('eq → term, does NOT append .keyword for non-string values', () => {
    const clause = compileToElasticQuery(eq<TestPerson>('isActive', true));
    expect(clause).toEqual({ term: { isActive: true } });
  });

  it('eq → term, does not double-suffix an already-keyword field', () => {
    const clause = compileToElasticQuery(eq<TestPerson>('data.unit.keyword', 'A'));
    expect(clause).toEqual({ term: { 'data.unit.keyword': 'A' } });
  });

  it('in (oneOf) → terms', () => {
    const clause = compileToElasticQuery(oneOf<TestPerson>('data.unit', ['A', 'B']));
    expect(clause).toEqual({ terms: { 'data.unit.keyword': ['A', 'B'] } });
  });

  it('nin (noneOf) → must_not over terms', () => {
    const clause = compileToElasticQuery(noneOf<TestPerson>('data.idNumber', ['1', '2']));
    expect(clause).toEqual({
      bool: { must_not: [{ terms: { 'data.idNumber.keyword': ['1', '2'] } }] },
    });
  });

  it('range → range', () => {
    const clause = compileToElasticQuery(range<TestPerson>('data.rank', { gte: 2, lte: 5 }));
    expect(clause).toEqual({ range: { 'data.rank': { gte: 2, lte: 5 } } });
  });

  it('exists → exists', () => {
    const clause = compileToElasticQuery(exists<TestPerson>('data.phone'));
    expect(clause).toEqual({ exists: { field: 'data.phone' } });
  });

  it('and → bool.filter', () => {
    const clause = compileToElasticQuery(
      and<TestPerson>(eq('isActive', true), exists('data.phone')),
    );
    expect(clause).toEqual({
      bool: { filter: [{ term: { isActive: true } }, { exists: { field: 'data.phone' } }] },
    });
  });

  it('or → bool.should + minimum_should_match:1', () => {
    const clause = compileToElasticQuery(
      or<TestPerson>(eq('data.unit', 'A'), eq('data.unit', 'B')),
    );
    expect(clause).toEqual({
      bool: {
        should: [{ term: { 'data.unit.keyword': 'A' } }, { term: { 'data.unit.keyword': 'B' } }],
        minimum_should_match: 1,
      },
    });
  });

  it('not → bool.must_not', () => {
    const clause = compileToElasticQuery(not<TestPerson>(eq('isActive', true)));
    expect(clause).toEqual({ bool: { must_not: [{ term: { isActive: true } }] } });
  });

  it('throws (does not fail silently) when an in/nin list exceeds the inline terms limit', () => {
    const tooMany = Array.from({ length: MAX_INLINE_TERMS + 1 }, (_, i) => String(i));
    expect(() => compileToElasticQuery(oneOf<TestPerson>('data.idNumber', tooMany))).toThrow(
      /terms lookup/i,
    );
    expect(() => compileToElasticQuery(noneOf<TestPerson>('data.idNumber', tooMany))).toThrow(
      /terms lookup/i,
    );
  });
});
