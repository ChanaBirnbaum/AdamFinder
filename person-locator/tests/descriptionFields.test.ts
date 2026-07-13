import { describe, it, expect } from 'vitest';
import { parseDescriptionEntries } from '../src/utils/descriptionFields';

describe('parseDescriptionEntries', () => {
  it('parses a braces-wrapped Hebrew header blob', () => {
    expect(parseDescriptionEntries('{שיבוץ:11111, אזור:4444, סטטוס:פעיל, תא:455}')).toEqual({
      'שיבוץ': '11111',
      'אזור': '4444',
      'סטטוס': 'פעיל',
      'תא': '455',
    });
  });

  it('trims whitespace and works without braces', () => {
    expect(parseDescriptionEntries(' סטטוס : פעיל , אזור : 4 ')).toEqual({
      'סטטוס': 'פעיל',
      'אזור': '4',
    });
  });

  it('skips malformed segments instead of failing', () => {
    expect(parseDescriptionEntries('{סטטוס:פעיל, ללא-נקודתיים, :ערך-בלי-מפתח}')).toEqual({
      'סטטוס': 'פעיל',
    });
  });

  it('returns {} for null, undefined and non-string primitives', () => {
    expect(parseDescriptionEntries(null)).toEqual({});
    expect(parseDescriptionEntries(undefined)).toEqual({});
    expect(parseDescriptionEntries(42)).toEqual({});
    expect(parseDescriptionEntries('')).toEqual({});
  });

  it('accepts an already-parsed object as-is', () => {
    expect(parseDescriptionEntries({ 'סטטוס': 'פעיל', 'תא': 455, empty: null })).toEqual({
      'סטטוס': 'פעיל',
      'תא': '455',
    });
  });
});
