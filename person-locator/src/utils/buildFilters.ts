import type { Filter, FilterOperator } from '../types';

type ESClause = Record<string, unknown>;

function buildClause(filter: Filter): ESClause {
  const { fieldName, value, operator } = filter;
  switch (operator as FilterOperator) {
    case 'equals':
      return { term: { [fieldName]: value } };
    case 'exists':
      return { exists: { field: fieldName } };
    case 'gt':
      return { range: { [fieldName]: { gt: value } } };
    case 'lt':
      return { range: { [fieldName]: { lt: value } } };
    case 'contains':
      return { match: { [fieldName]: value } };
    default:
      throw new Error(`Unknown filter operator: ${operator}`);
  }
}

/**
 * Convert Filter[] to Elasticsearch bool query filter clauses.
 */
export function buildFilters(filters: Filter[]): ESClause[] {
  return filters.map(buildClause);
}
