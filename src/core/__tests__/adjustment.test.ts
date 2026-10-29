import { describe, expect, it } from '@jest/globals';

import { getSupportedRange, toGregorian, toHijri } from '../convert';

const ADJUSTMENTS = [-2, -1, 0, 1, 2];
const MS_PER_DAY = 86_400_000;

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Every Gregorian day whose Umm al-Qura date is in the table. */
function* everyTableDay() {
  const first = toGregorian(getSupportedRange().min);
  const last = toGregorian(getSupportedRange().max);
  for (let date = first; date <= last; date = addDays(date, 1)) {
    yield date;
  }
}

describe('Hijri adjustment', () => {
  it('shifts 1 Ramadan 1445 (11 March 2024) by whole days', () => {
    const ramadan1 = { year: 1445, month: 9, day: 1 };
    expect(toGregorian(ramadan1)).toEqual(new Date(2024, 2, 11));
    // The month started a day earlier: 1 Ramadan is 10 March.
    expect(toGregorian(ramadan1, { adjustment: 1 })).toEqual(
      new Date(2024, 2, 10)
    );
    expect(toHijri(new Date(2024, 2, 10), { adjustment: 1 })).toEqual(ramadan1);
    // The month started a day later: 1 Ramadan is 12 March.
    expect(toGregorian(ramadan1, { adjustment: -1 })).toEqual(
      new Date(2024, 2, 12)
    );
    // Sha'ban 1445 has 29 days in Umm al-Qura, and a shift keeps month
    // lengths: 11 March is 29 Sha'ban, then 12 March is 1 Ramadan.
    expect(toHijri(new Date(2024, 2, 11), { adjustment: -1 })).toEqual({
      year: 1445,
      month: 8,
      day: 29,
    });
  });

  it('equals Umm al-Qura on the shifted day, for every day and adjustment', () => {
    const mismatches: string[] = [];
    for (const adjustment of ADJUSTMENTS) {
      for (const date of everyTableDay()) {
        // The adjusted date of a day is the Umm al-Qura date `adjustment`
        // days later, when that day is in the table.
        const shifted = addDays(date, adjustment);
        let expected;
        try {
          expected = toHijri(shifted);
        } catch {
          continue;
        }
        const actual = toHijri(date, { adjustment });
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          mismatches.push(`${adjustment} ${date.toDateString()}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('round-trips every day for every adjustment', () => {
    const mismatches: string[] = [];
    for (const adjustment of ADJUSTMENTS) {
      for (const date of everyTableDay()) {
        const day = addDays(date, -adjustment);
        const back = toGregorian(toHijri(day, { adjustment }), { adjustment });
        if (back.getTime() !== day.getTime()) {
          mismatches.push(`${adjustment} ${day.toDateString()}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('treats a missing adjustment as 0', () => {
    const date = new Date(2024, 6, 7);
    expect(toHijri(date, {})).toEqual(toHijri(date));
    expect(toHijri(date, { adjustment: 0 })).toEqual(toHijri(date));
  });

  it('moves the supported Gregorian range with the adjustment', () => {
    const { min, max } = getSupportedRange();
    // +2: 1 Muharram 1356 is two days earlier than in Umm al-Qura.
    expect(toGregorian(min, { adjustment: 2 })).toEqual(new Date(1937, 2, 12));
    expect(toGregorian(max, { adjustment: 2 })).toEqual(new Date(2077, 10, 14));
    expect(() => toHijri(new Date(1937, 2, 11), { adjustment: 2 })).toThrow(
      RangeError
    );
    expect(() => toHijri(new Date(2077, 10, 15), { adjustment: 2 })).toThrow(
      /1937-03-12 to 2077-11-14/
    );
    // -2: two days later.
    expect(toGregorian(min, { adjustment: -2 })).toEqual(new Date(1937, 2, 16));
    expect(() => toHijri(new Date(1937, 2, 15), { adjustment: -2 })).toThrow(
      RangeError
    );
  });

  it('rejects adjustments that are not an integer from -2 to 2', () => {
    for (const adjustment of [3, -3, 0.5, Number.NaN, Infinity]) {
      expect(() => toHijri(new Date(2024, 6, 7), { adjustment })).toThrow(
        /integer from -2 to 2/
      );
      expect(() =>
        toGregorian({ year: 1446, month: 1, day: 1 }, { adjustment })
      ).toThrow(RangeError);
    }
  });

  it('covers every day of the shifted range', () => {
    const { min, max } = getSupportedRange();
    for (const adjustment of ADJUSTMENTS) {
      const first = toGregorian(min, { adjustment });
      const last = toGregorian(max, { adjustment });
      expect((last.getTime() - first.getTime()) / MS_PER_DAY + 1).toBe(51_383);
    }
  });
});
