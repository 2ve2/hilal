import { describe, expect, it } from '@jest/globals';

import {
  getHijriMonthLength,
  getSupportedRange,
  isValidHijri,
  toGregorian,
  toHijri,
} from '../convert';
import { civilFromDays, daysFromCivil } from '../days';

// Public reference dates, independent of the generated table. Each one was
// checked against Node's ICU before being written down here.
const KNOWN_DATES: Array<[string, string, [number, number, number]]> = [
  ['1 Muharram 1446', '2024-07-07', [1446, 1, 1]],
  ['1 Ramadan 1445', '2024-03-11', [1445, 9, 1]],
  ['1 Shawwal 1445', '2024-04-10', [1445, 10, 1]],
  ['10 Dhu al-Hijjah 1445', '2024-06-16', [1445, 12, 10]],
  ['1 Ramadan 1446', '2025-03-01', [1446, 9, 1]],
  ['1 Muharram 1445', '2023-07-19', [1445, 1, 1]],
  ['24 Ramadan 1420', '2000-01-01', [1420, 9, 24]],
];

function localDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(year, month - 1, day);
}

describe('days', () => {
  it('round-trips epoch days through civil dates', () => {
    for (let epochDay = -30000; epochDay <= 50000; epochDay += 17) {
      const { year, month, day } = civilFromDays(epochDay);
      expect(daysFromCivil(year, month, day)).toBe(epochDay);
    }
  });

  it('counts from 1970-01-01', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(daysFromCivil(2000, 3, 1)).toBe(11017);
    expect(civilFromDays(-1)).toEqual({ year: 1969, month: 12, day: 31 });
  });
});

describe('toHijri / toGregorian', () => {
  it.each(KNOWN_DATES)('%s is %s', (_, iso, [year, month, day]) => {
    expect(toHijri(localDate(iso))).toEqual({ year, month, day });
    expect(toGregorian({ year, month, day })).toEqual(localDate(iso));
  });

  it('ignores the time of day', () => {
    expect(toHijri(new Date(2024, 6, 7, 0, 0, 0))).toEqual(
      toHijri(new Date(2024, 6, 7, 23, 59, 59, 999))
    );
  });

  it('returns local midnight', () => {
    const date = toGregorian({ year: 1446, month: 1, day: 1 });
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([
      0, 0, 0,
    ]);
  });

  it('converts both ends of the supported range', () => {
    const { min, max } = getSupportedRange();
    expect(toGregorian(min)).toEqual(new Date(1937, 2, 14));
    expect(toGregorian(max)).toEqual(new Date(2077, 10, 16));
    expect(toHijri(new Date(1937, 2, 14))).toEqual(min);
    expect(toHijri(new Date(2077, 10, 16))).toEqual(max);
  });

  it('throws a RangeError outside the supported range', () => {
    expect(() => toHijri(new Date(1937, 2, 13))).toThrow(RangeError);
    expect(() => toHijri(new Date(2077, 10, 17))).toThrow(RangeError);
    expect(() => toHijri(new Date(2077, 10, 17))).toThrow(
      /outside the supported range/
    );
    expect(() => toGregorian({ year: 1355, month: 12, day: 29 })).toThrow(
      RangeError
    );
    expect(() => toGregorian({ year: 1501, month: 1, day: 1 })).toThrow(
      RangeError
    );
  });

  it('throws a RangeError for invalid input', () => {
    expect(() => toHijri(new Date(Number.NaN))).toThrow(RangeError);
    expect(() => toGregorian({ year: 1446, month: 13, day: 1 })).toThrow(
      RangeError
    );
    expect(() => toGregorian({ year: 1446, month: 1, day: 31 })).toThrow(
      RangeError
    );
  });
});

describe('getHijriMonthLength', () => {
  it('is always 29 or 30', () => {
    const { min, max } = getSupportedRange();
    for (let year = min.year; year <= max.year; year++) {
      for (let month = 1; month <= 12; month++) {
        expect([29, 30]).toContain(getHijriMonthLength(year, month));
      }
    }
  });

  it('matches known months', () => {
    expect(getHijriMonthLength(1445, 9)).toBe(30); // Ramadan 1445
    expect(getHijriMonthLength(1446, 9)).toBe(29); // Ramadan 1446
  });

  it('throws a RangeError for months outside the range', () => {
    expect(() => getHijriMonthLength(1355, 12)).toThrow(RangeError);
    expect(() => getHijriMonthLength(1501, 1)).toThrow(RangeError);
    expect(() => getHijriMonthLength(1446, 0)).toThrow(RangeError);
    expect(() => getHijriMonthLength(1446, 13)).toThrow(RangeError);
    expect(() => getHijriMonthLength(1446.5, 1)).toThrow(RangeError);
  });
});

describe('isValidHijri', () => {
  it('accepts real days in range', () => {
    expect(isValidHijri({ year: 1446, month: 9, day: 29 })).toBe(true);
    expect(isValidHijri(getSupportedRange().min)).toBe(true);
    expect(isValidHijri(getSupportedRange().max)).toBe(true);
  });

  it('rejects impossible or out-of-range days', () => {
    expect(isValidHijri({ year: 1446, month: 9, day: 30 })).toBe(false);
    expect(isValidHijri({ year: 1446, month: 9, day: 0 })).toBe(false);
    expect(isValidHijri({ year: 1446, month: 0, day: 1 })).toBe(false);
    expect(isValidHijri({ year: 1355, month: 12, day: 1 })).toBe(false);
    expect(isValidHijri({ year: 1501, month: 1, day: 1 })).toBe(false);
    expect(isValidHijri({ year: 1446, month: 1, day: 1.5 })).toBe(false);
    expect(isValidHijri(null as never)).toBe(false);
  });
});

describe('getSupportedRange', () => {
  it('covers 1 Muharram 1356 to the end of 1500', () => {
    expect(getSupportedRange()).toEqual({
      min: { year: 1356, month: 1, day: 1 },
      max: { year: 1500, month: 12, day: 30 },
    });
  });
});
