import { describe, expect, it } from '@jest/globals';

import { getMonthNames, getWeekdayNames, toArabicDigits } from '../locale';

describe('getMonthNames', () => {
  it('returns 12 Hijri month names in each locale', () => {
    const ar = getMonthNames('hijri', 'ar');
    const en = getMonthNames('hijri', 'en');
    expect(ar).toHaveLength(12);
    expect(en).toHaveLength(12);
    expect(ar[0]).toBe('محرم');
    expect(ar[8]).toBe('رمضان');
    expect(ar[11]).toBe('ذو الحجة');
    expect(en[8]).toBe('Ramadan');
  });

  it('uses Saudi/Gulf Arabic names for Gregorian months', () => {
    expect(getMonthNames('gregorian', 'ar')).toEqual([
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ]);
    expect(getMonthNames('gregorian', 'ar')).not.toContain('كانون الثاني');
    expect(getMonthNames('gregorian', 'en')[0]).toBe('January');
  });

  it('returns a fresh array that callers may mutate', () => {
    const names = getMonthNames('hijri', 'en');
    names[0] = 'changed';
    expect(getMonthNames('hijri', 'en')[0]).toBe('Muharram');
  });
});

describe('getWeekdayNames', () => {
  it('starts on Sunday to match Date#getDay()', () => {
    expect(getWeekdayNames('en')[new Date(2024, 6, 5).getDay()]).toBe('Friday');
    expect(getWeekdayNames('ar')[0]).toBe('الأحد');
    expect(getWeekdayNames('ar')[5]).toBe('الجمعة');
  });

  it('defaults to long names and supports short names', () => {
    expect(getWeekdayNames('en')).toHaveLength(7);
    expect(getWeekdayNames('en', 'short')).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expect(getWeekdayNames('ar', 'short')).toHaveLength(7);
  });
});

describe('narrow weekday names', () => {
  it('match ICU', () => {
    for (const locale of ['ar', 'en'] as const) {
      const icu = new Intl.DateTimeFormat(locale, {
        weekday: 'narrow',
        timeZone: 'UTC',
      });
      // 7 January 2024 was a Sunday.
      const expected = [0, 1, 2, 3, 4, 5, 6].map((i) =>
        icu.format(new Date(Date.UTC(2024, 0, 7 + i)))
      );
      expect(getWeekdayNames(locale, 'narrow')).toEqual(expected);
    }
  });
});

describe('toArabicDigits', () => {
  it('converts every Latin digit', () => {
    expect(toArabicDigits('0123456789')).toBe('٠١٢٣٤٥٦٧٨٩');
  });

  it('accepts numbers and keeps other characters', () => {
    expect(toArabicDigits(1446)).toBe('١٤٤٦');
    expect(toArabicDigits('1/9/1446 هـ')).toBe('١/٩/١٤٤٦ هـ');
    expect(toArabicDigits('')).toBe('');
  });
});
