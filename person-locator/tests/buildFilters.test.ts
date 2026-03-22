import { describe, it, expect } from 'vitest';
import { buildFilters } from '../src/utils/buildFilters';
import type { Filter } from '../src/types';

describe('buildFilters', () => {
  it('equals operator generates term clause', () => {
    const filters: Filter[] = [{ fieldName: 'status', value: 'active', operator: 'equals' }];
    const result = buildFilters(filters);
    expect(result).toEqual([{ term: { status: 'active' } }]);
  });

  it('exists operator generates exists clause', () => {
    const filters: Filter[] = [{ fieldName: 'photoUrl', value: null, operator: 'exists' }];
    const result = buildFilters(filters);
    expect(result).toEqual([{ exists: { field: 'photoUrl' } }]);
  });

  it('exists with null value is valid', () => {
    const filters: Filter[] = [{ fieldName: 'rank', value: null, operator: 'exists' }];
    expect(() => buildFilters(filters)).not.toThrow();
    const result = buildFilters(filters);
    expect(result[0]).toEqual({ exists: { field: 'rank' } });
  });

  it('gt operator generates range clause', () => {
    const filters: Filter[] = [{ fieldName: 'age', value: 18, operator: 'gt' }];
    const result = buildFilters(filters);
    expect(result).toEqual([{ range: { age: { gt: 18 } } }]);
  });

  it('lt operator generates range clause', () => {
    const filters: Filter[] = [{ fieldName: 'score', value: 100, operator: 'lt' }];
    const result = buildFilters(filters);
    expect(result).toEqual([{ range: { score: { lt: 100 } } }]);
  });

  it('contains operator generates match clause', () => {
    const filters: Filter[] = [{ fieldName: 'fullName', value: 'John', operator: 'contains' }];
    const result = buildFilters(filters);
    expect(result).toEqual([{ match: { fullName: 'John' } }]);
  });

  it('returns multiple clauses for multiple filters', () => {
    const filters: Filter[] = [
      { fieldName: 'isActive', value: 1, operator: 'equals' },
      { fieldName: 'idNumber', value: null, operator: 'exists' },
    ];
    const result = buildFilters(filters);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ term: { isActive: 1 } });
    expect(result[1]).toEqual({ exists: { field: 'idNumber' } });
  });

  it('returns empty array for empty filters', () => {
    expect(buildFilters([])).toEqual([]);
  });
});
