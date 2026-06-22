import { describe, it, expect } from 'vitest';
import { eq, oneOf, noneOf, and } from '../../src/filters/builder';
import { compileToElasticQuery } from '../../src/filters/toElasticQuery';
import { compileToPredicate } from '../../src/filters/toPredicate';
import { evalEsClause, makePerson } from './testFixtures';
import type { TestPerson } from './testFixtures';

/**
 * The same filter tree must select the same people whether it's run as an Elasticsearch
 * query (via a mock ES evaluator, independent of compileToPredicate) or as a client-side
 * predicate — this is what guarantees the three sources stay in sync.
 */
describe('Filter consistency: mock Elasticsearch vs. predicate', () => {
  const tree = and<TestPerson>(
    eq('isActive', true),
    oneOf('data.unit', ['A', 'B']),
    noneOf('data.idNumber', ['999']),
  );

  const docs: TestPerson[] = [
    makePerson({ id: '1', isActive: true, data: { unit: 'A', idNumber: '111' } }), // matches
    makePerson({ id: '2', isActive: true, data: { unit: 'B', idNumber: '222' } }), // matches
    makePerson({ id: '3', isActive: false, data: { unit: 'A', idNumber: '333' } }), // inactive
    makePerson({ id: '4', isActive: true, data: { unit: 'C', idNumber: '444' } }), // wrong unit
    makePerson({ id: '5', isActive: true, data: { unit: 'A', idNumber: '999' } }), // excluded id
    makePerson({ id: '6', isActive: true, data: { idNumber: '555' } }), // missing unit
  ];

  it('selects the same person ids through the ES clause and through the predicate', () => {
    const esClause = compileToElasticQuery(tree);
    const predicate = compileToPredicate(tree);

    const esSelected = docs.filter((d) => evalEsClause(esClause, d)).map((d) => d.id);
    const predicateSelected = docs.filter(predicate).map((d) => d.id);

    expect(predicateSelected).toEqual(esSelected);
    expect(esSelected).toEqual(['1', '2']);
  });
});
