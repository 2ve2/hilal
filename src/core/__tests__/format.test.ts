import { describe, expect, it } from '@jest/globals';

import { formatGregorian, formatHijri } from '../format';

const RAMADAN_1 = { year: 1446, month: 9, day: 1 };

describe('formatHijri', () => {
  it('defaults to Arabic with Arabic-Indic digits', () => {
    expect(formatHijri(RAMADAN_1)).toBe('١ رمضان ١٤٤٦ هـ');
  });

  it('formats English with Latin digits by default', () => {
    expect(formatHijri(RAMADAN_1, { locale: 'en' })).toBe('1 Ramadan 1446 AH');
  });

  it('lets digits be chosen independently of the locale', () => {
    expect(formatHijri(RAMADAN_1, { locale: 'ar', digits: 'latin' })).toBe(
      '1 رمضان 1446 هـ'
    );
    expect(formatHijri(RAMADAN_1, { locale: 'en', digits: 'arabic' })).toBe(
      '١ Ramadan ١٤٤٦ AH'
    );
  });

  it('formats multi-word month names', () => {
    expect(
      formatHijri({ year: 1445, month: 12, day: 10 }, { locale: 'ar' })
    ).toBe('١٠ ذو الحجة ١٤٤٥ هـ');
  });

  it('throws a RangeError for invalid dates', () => {
    expect(() => formatHijri({ year: 1446, month: 9, day: 30 })).toThrow(
      RangeError
    );
    expect(() => formatHijri({ year: 1600, month: 1, day: 1 })).toThrow(
      RangeError
    );
  });
});

describe('formatGregorian', () => {
  const date = { year: 2024, month: 3, day: 11 };

  it('uses Gulf month names and Arabic-Indic digits for Arabic', () => {
    expect(formatGregorian(date)).toBe('١١ مارس ٢٠٢٤');
  });

  it('formats English with Latin digits', () => {
    expect(formatGregorian(date, { locale: 'en' })).toBe('11 March 2024');
    expect(formatGregorian(date, { locale: 'ar', digits: 'latin' })).toBe(
      '11 مارس 2024'
    );
  });
});
