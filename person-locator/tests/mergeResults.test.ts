import { describe, it, expect } from 'vitest';
import { mergeResults } from '../src/utils/mergeResults';
import type { PersonResult } from '../src/types';

const makeES = (id: string, name = 'ES Person'): PersonResult => ({
  id,
  personType: 'ezrach',
  fullName: name,
  isActive: true,
  source: 'elasticsearch',
});

const makeOnline = (id: string, name = 'Online Person'): PersonResult => ({
  id,
  personType: 'ezrach',
  fullName: name,
  isActive: true,
  source: 'online',
});

describe('mergeResults', () => {
  it('returns online results first, then ES-only results', () => {
    const es = [makeES('1'), makeES('2')];
    const online = [makeOnline('3')];
    const result = mergeResults(es, online);
    expect(result[0].id).toBe('3');
    expect(result[1].id).toBe('1');
    expect(result[2].id).toBe('2');
  });

  it('online results take priority over ES on duplicate ID', () => {
    const es = [makeES('1', 'ES Name')];
    const online = [makeOnline('1', 'Online Name')];
    const result = mergeResults(es, online);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Online Name');
    expect(result[0].source).toBe('online');
  });

  it('no duplicates in output', () => {
    const es = [makeES('1'), makeES('2'), makeES('3')];
    const online = [makeOnline('2'), makeOnline('3')];
    const result = mergeResults(es, online);
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result).toHaveLength(3);
  });

  it('handles empty arrays', () => {
    expect(mergeResults([], [])).toEqual([]);
    expect(mergeResults([makeES('1')], [])).toHaveLength(1);
    expect(mergeResults([], [makeOnline('1')])).toHaveLength(1);
  });

  it('online results appear before ES-unique results in correct order', () => {
    const es = [makeES('a'), makeES('b')];
    const online = [makeOnline('c'), makeOnline('d')];
    const result = mergeResults(es, online);
    expect(result.map((r) => r.id)).toEqual(['c', 'd', 'a', 'b']);
  });
});
