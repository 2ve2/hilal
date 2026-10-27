/**
 * Checks every day of the supported range against the Umm al-Qura
 * calendar in Node's built-in ICU. The library itself never uses `Intl`
 * calendars at runtime; this test proves that the generated table and the
 * conversion logic reproduce ICU exactly.
 *
 * Requires a Node.js build with full ICU (the official builds have it).
 */
import { beforeAll, describe, expect, it } from '@jest/globals';

import {
  getHijriMonthLength,
  getSupportedRange,
  toGregorian,
  toHijri,
} from '../convert';
import type { HijriDate } from '../types';

const MS_PER_DAY = 86_400_000;

const icu = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
});

/** ICU's Umm al-Qura date for a Gregorian year/month/day. */
function icuHijri(year: number, month: number, day: number): HijriDate {
  const parts = icu.formatToParts(new Date(Date.UTC(year, month - 1, day)));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Every Gregorian day in the supported range, as UTC civil dates. */
function* everyDayInRange() {
  const first = toGregorian(getSupportedRange().min);
  const last = toGregorian(getSupportedRange().max);
  const start = Date.UTC(
    first.getFullYear(),
    first.getMonth(),
    first.getDate()
  );
  const end = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  for (let ms = start; ms <= end; ms += MS_PER_DAY) {
    const utc = new Date(ms);
    yield {
      year: utc.getUTCFullYear(),
      month: utc.getUTCMonth() + 1,
      day: utc.getUTCDate(),
    };
  }
}

const iso = (d: { year: number; month: number; day: number }) =>
  `${d.year}-${d.month}-${d.day}`;

describe('Umm al-Qura cross-check against ICU', () => {
  beforeAll(() => {
    if (icu.resolvedOptions().calendar !== 'islamic-umalqura') {
      throw new Error(
        'This Node.js build has no islamic-umalqura calendar. Run the tests ' +
          'on an official Node.js build with full ICU.'
      );
    }
  });

  it('covers every day from 1937-03-14 to 2077-11-16', () => {
    const days = [...everyDayInRange()];
    expect(days[0]).toEqual({ year: 1937, month: 3, day: 14 });
    expect(days[days.length - 1]).toEqual({ year: 2077, month: 11, day: 16 });
    expect(days).toHaveLength(
      (Date.UTC(2077, 10, 16) - Date.UTC(1937, 2, 14)) / MS_PER_DAY + 1
    );
  });

  it('agrees with ICU on every day in the range', () => {
    const mismatches: string[] = [];
    for (const g of everyDayInRange()) {
      const expected = icuHijri(g.year, g.month, g.day);
      for (const date of [
        new Date(g.year, g.month - 1, g.day, 0, 0, 0, 0),
        new Date(g.year, g.month - 1, g.day, 23, 59, 59, 999),
      ]) {
        const actual = toHijri(date);
        if (
          actual.year !== expected.year ||
          actual.month !== expected.month ||
          actual.day !== expected.day
        ) {
          mismatches.push(
            `${iso(g)} ${date.getHours()}h: got ${iso(actual)}, ` +
              `ICU says ${iso(expected)}`
          );
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('round-trips every day: toGregorian(toHijri(d)) equals d', () => {
    const mismatches: string[] = [];
    for (const g of everyDayInRange()) {
      const date = new Date(g.year, g.month - 1, g.day);
      const back = toGregorian(toHijri(date));
      if (back.getTime() !== date.getTime()) {
        mismatches.push(`${iso(g)} came back as ${back.toString()}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('agrees with ICU on every month length', () => {
    const mismatches: string[] = [];
    const { min, max } = getSupportedRange();
    for (let year = min.year; year <= max.year; year++) {
      for (let month = 1; month <= 12; month++) {
        const length = getHijriMonthLength(year, month);
        const lastDay = toGregorian({ year, month, day: length });
        const next = icuHijri(
          lastDay.getFullYear(),
          lastDay.getMonth() + 1,
          lastDay.getDate() + 1
        );
        if (next.day !== 1) {
          mismatches.push(`${year}-${month}: ${length} days, ICU disagrees`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('ends exactly where ICU leaves the supported years', () => {
    expect(icuHijri(1937, 3, 13)).toEqual({ year: 1355, month: 12, day: 29 });
    expect(icuHijri(2077, 11, 17)).toEqual({ year: 1501, month: 1, day: 1 });
    expect(() => toHijri(new Date(1937, 2, 13))).toThrow(RangeError);
    expect(() => toHijri(new Date(2077, 10, 17))).toThrow(RangeError);
  });
});
