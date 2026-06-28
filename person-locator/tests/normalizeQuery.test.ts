import { describe, it, expect } from 'vitest';
import { normalizeQuery } from '../src/utils/normalizeQuery';

describe('normalizeQuery', () => {
  it('converts a pure English-keyboard input to the Hebrew it was meant to type', () => {
    expect(normalizeQuery('sbh')).toBe('דני');
  });

  it('leaves Hebrew input unchanged', () => {
    expect(normalizeQuery('דני')).toBe('דני');
  });

  it('converts mixed Latin/non-Latin input, leaving digits and spaces as-is', () => {
    expect(normalizeQuery('sbh 123')).toBe('דני 123');
  });

  it('returns an empty string unchanged', () => {
    expect(normalizeQuery('')).toBe('');
  });

  it('handles null/undefined without throwing', () => {
    expect(normalizeQuery(null)).toBe('');
    expect(normalizeQuery(undefined)).toBe('');
  });

  it('maps uppercase Latin letters via their lowercase position', () => {
    expect(normalizeQuery('SBH')).toBe('דני');
  });
});
