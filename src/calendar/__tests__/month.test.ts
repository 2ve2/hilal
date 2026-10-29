import { describe, expect, it } from '@jest/globals';

import { daysFromCivil } from '../../core/days';
import {
  addMonths,
  monthsOfYear,
  pageOverlaps,
  yearOverlaps,
  yearPageStart,
  yearsOnPage,
  yearsSecondaryTitle,
  buildMonthGrid,
  monthContaining,
  monthLength,
  monthOverlaps,
  monthStart,
  monthTitle,
  secondaryTitle,
  selectableRange,
  SUPPORTED_DAYS,
  type CalendarMonth,
  type DayCell,
} from '../month';

const hijri = (year: number, month: number): CalendarMonth => ({
  calendar: 'hijri',
  year,
  month,
});
const gregorian = (year: number, month: number): CalendarMonth => ({
  calendar: 'gregorian',
  year,
  month,
});

const RAMADAN_1445 = hijri(1445, 9); // 11 March - 9 April 2024, starts Monday

function days(m: CalendarMonth, firstDayOfWeek = 0) {
  return buildMonthGrid(m, firstDayOfWeek)
    .flat()
    .filter((cell): cell is DayCell => cell !== null);
}

/** Every month of a calendar that overlaps the supported range. */
function everyMonth(calendar: CalendarMonth['calendar']) {
  const months: CalendarMonth[] = [];
  let m = monthContaining(SUPPORTED_DAYS.min, calendar);
  while (monthOverlaps(m, SUPPORTED_DAYS)) {
    months.push(m);
    m = addMonths(m, 1);
  }
  return months;
}

describe('buildMonthGrid', () => {
  it('lays out Ramadan 1445 from Sunday', () => {
    const weeks = buildMonthGrid(RAMADAN_1445, 0);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBeNull(); // Sunday 10 March is Sha'ban
    expect(weeks[0]![1]).toMatchObject({ day: 1, secondaryDay: 11 });
    expect(days(RAMADAN_1445).at(-1)).toMatchObject({
      day: 30,
      secondaryDay: 9,
    });
  });

  it.each([
    [0, 1], // Sunday first: Monday is the 2nd column
    [1, 0], // Monday first
    [6, 2], // Saturday first
  ])('starts the week on day %i', (firstDayOfWeek, column) => {
    const firstWeek = buildMonthGrid(RAMADAN_1445, firstDayOfWeek)[0]!;
    expect(firstWeek.findIndex((cell) => cell?.day === 1)).toBe(column);
  });

  it('lays out every month of both calendars correctly', () => {
    for (const calendar of ['hijri', 'gregorian'] as const) {
      for (const m of everyMonth(calendar)) {
        const weeks = buildMonthGrid(m, 6);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
        const cells = weeks.flat().filter((c): c is DayCell => c !== null);
        expect(cells).toHaveLength(monthLength(m));
        cells.forEach((cell, i) => {
          expect(cell.day).toBe(i + 1);
          expect(cell.epochDay).toBe(monthStart(m) + i);
        });
      }
    }
  });

  it('has no secondary date outside the supported range', () => {
    const cells = days(gregorian(1937, 3)); // range starts 14 March 1937
    expect(cells[12]).toMatchObject({ day: 13, secondaryDay: null });
    expect(cells[13]).toMatchObject({ day: 14, secondaryDay: 1 });
    const last = days(gregorian(2077, 11)); // range ends 16 November 2077
    expect(last[15]).toMatchObject({ day: 16, secondaryDay: 30 });
    expect(last[16]).toMatchObject({ day: 17, secondaryDay: null });
  });
});

describe('header titles', () => {
  it('names the primary month', () => {
    expect(monthTitle(RAMADAN_1445, 'ar', 'arabic')).toBe('رمضان ١٤٤٥');
    expect(monthTitle(RAMADAN_1445, 'en', 'latin')).toBe('Ramadan 1445');
    expect(monthTitle(gregorian(2025, 3), 'ar', 'arabic')).toBe('مارس ٢٠٢٥');
  });

  it('names the secondary months the primary month overlaps', () => {
    expect(secondaryTitle(RAMADAN_1445, 'ar', 'arabic')).toBe(
      'مارس – أبريل ٢٠٢٤'
    );
    expect(secondaryTitle(RAMADAN_1445, 'en', 'latin')).toBe(
      'March – April 2024'
    );
    expect(secondaryTitle(gregorian(2025, 1), 'ar', 'arabic')).toBe(
      'رجب – شعبان ١٤٤٦'
    );
  });

  it('collapses to one month when the overlap is a single month', () => {
    // Ramadan 1446 is 1-29 March 2025.
    expect(secondaryTitle(hijri(1446, 9), 'en', 'latin')).toBe('March 2025');
  });

  it('repeats the year when the overlap crosses a year boundary', () => {
    expect(secondaryTitle(hijri(1445, 6), 'en', 'latin')).toBe(
      'December 2023 – January 2024'
    );
    expect(secondaryTitle(gregorian(2024, 7), 'en', 'latin')).toBe(
      'Dhu al-Hijjah 1445 – Muharram 1446'
    );
  });

  it('only counts days inside the supported range', () => {
    expect(secondaryTitle(gregorian(1937, 3), 'en', 'latin')).toBe(
      'Muharram 1356'
    );
  });
});

describe('navigation', () => {
  it('adds months across year boundaries', () => {
    expect(addMonths(hijri(1445, 12), 1)).toEqual(hijri(1446, 1));
    expect(addMonths(hijri(1446, 1), -1)).toEqual(hijri(1445, 12));
    expect(addMonths(gregorian(2024, 3), -15)).toEqual(gregorian(2022, 12));
  });

  it('stops at the edges of the supported range', () => {
    expect(monthOverlaps(hijri(1356, 1), SUPPORTED_DAYS)).toBe(true);
    expect(monthOverlaps(hijri(1355, 12), SUPPORTED_DAYS)).toBe(false);
    expect(monthOverlaps(hijri(1500, 12), SUPPORTED_DAYS)).toBe(true);
    expect(monthOverlaps(hijri(1501, 1), SUPPORTED_DAYS)).toBe(false);
    expect(monthOverlaps(gregorian(1937, 3), SUPPORTED_DAYS)).toBe(true);
    expect(monthOverlaps(gregorian(1937, 2), SUPPORTED_DAYS)).toBe(false);
    expect(monthOverlaps(gregorian(2077, 11), SUPPORTED_DAYS)).toBe(true);
    expect(monthOverlaps(gregorian(2077, 12), SUPPORTED_DAYS)).toBe(false);
  });

  it('stops at minDate and maxDate', () => {
    const range = selectableRange(
      daysFromCivil(2024, 3, 20),
      daysFromCivil(2024, 5, 2)
    );
    expect(monthOverlaps(gregorian(2024, 2), range)).toBe(false);
    expect(monthOverlaps(gregorian(2024, 3), range)).toBe(true);
    expect(monthOverlaps(gregorian(2024, 5), range)).toBe(true);
    expect(monthOverlaps(gregorian(2024, 6), range)).toBe(false);
    expect(monthOverlaps(hijri(1445, 9), range)).toBe(true);
    expect(monthOverlaps(hijri(1445, 8), range)).toBe(false);
  });

  it('never lets minDate/maxDate widen the supported range', () => {
    expect(selectableRange(-1e9, 1e9)).toEqual(SUPPORTED_DAYS);
    expect(selectableRange(undefined, undefined)).toEqual(SUPPORTED_DAYS);
  });

  it('clamps out-of-range days to the nearest supported month', () => {
    expect(monthContaining(-1e6, 'hijri')).toEqual(hijri(1356, 1));
    expect(monthContaining(1e6, 'gregorian')).toEqual(gregorian(2077, 11));
  });
});

describe('month and year picker', () => {
  const enabled = (items: Array<{ value: number; disabled: boolean }>) =>
    items.filter((item) => !item.disabled).map((item) => item.value);

  it('enables every month of a year inside the range', () => {
    expect(enabled(monthsOfYear('hijri', 1445, SUPPORTED_DAYS))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('disables months outside minDate and maxDate', () => {
    // 20 March - 2 May 2024: Ramadan and Shawwal 1445, March - May 2024.
    const range = selectableRange(
      daysFromCivil(2024, 3, 20),
      daysFromCivil(2024, 5, 2)
    );
    expect(enabled(monthsOfYear('hijri', 1445, range))).toEqual([9, 10]);
    expect(enabled(monthsOfYear('gregorian', 2024, range))).toEqual([3, 4, 5]);
    expect(enabled(monthsOfYear('gregorian', 2025, range))).toEqual([]);
  });

  it('disables Gregorian months outside the supported range', () => {
    // The range starts 14 March 1937 and ends 16 November 2077.
    expect(enabled(monthsOfYear('gregorian', 1937, SUPPORTED_DAYS))).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(enabled(monthsOfYear('gregorian', 2077, SUPPORTED_DAYS))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('knows which years can be shown', () => {
    expect(yearOverlaps('hijri', 1356, SUPPORTED_DAYS)).toBe(true);
    expect(yearOverlaps('hijri', 1355, SUPPORTED_DAYS)).toBe(false);
    expect(yearOverlaps('hijri', 1500, SUPPORTED_DAYS)).toBe(true);
    expect(yearOverlaps('hijri', 1501, SUPPORTED_DAYS)).toBe(false);
    expect(yearOverlaps('gregorian', 1937, SUPPORTED_DAYS)).toBe(true);
    expect(yearOverlaps('gregorian', 1936, SUPPORTED_DAYS)).toBe(false);
    expect(yearOverlaps('gregorian', 2078, SUPPORTED_DAYS)).toBe(false);
  });

  it('pages years twelve at a time', () => {
    expect(yearPageStart(1445)).toBe(1440);
    expect(yearPageStart(1440)).toBe(1440);
    expect(yearPageStart(2024)).toBe(2016);
    expect(
      yearsOnPage('hijri', 1440, SUPPORTED_DAYS).map((y) => y.value)
    ).toEqual([
      1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451,
    ]);
  });

  it('stops paging at the edges of the supported range', () => {
    // First Hijri page: 1356-1367, all supported; the page before has none.
    expect(enabled(yearsOnPage('hijri', 1356, SUPPORTED_DAYS))).toHaveLength(
      12
    );
    expect(pageOverlaps('hijri', 1344, SUPPORTED_DAYS)).toBe(false);
    // Last Hijri page: only 1500.
    expect(enabled(yearsOnPage('hijri', 1500, SUPPORTED_DAYS))).toEqual([1500]);
    expect(pageOverlaps('hijri', 1512, SUPPORTED_DAYS)).toBe(false);
    // Gregorian: 1932-1943 starts with five unsupported years.
    expect(enabled(yearsOnPage('gregorian', 1932, SUPPORTED_DAYS))[0]).toBe(
      1937
    );
    expect(pageOverlaps('gregorian', 1920, SUPPORTED_DAYS)).toBe(false);
  });

  it('respects minDate and maxDate when paging', () => {
    const range = selectableRange(
      daysFromCivil(2024, 3, 20),
      daysFromCivil(2024, 5, 2)
    );
    expect(enabled(yearsOnPage('hijri', 1440, range))).toEqual([1445]);
    expect(pageOverlaps('hijri', 1428, range)).toBe(false);
    expect(pageOverlaps('hijri', 1452, range)).toBe(false);
  });

  it('names the years of the other calendar', () => {
    // 1445 AH is 19 July 2023 - 6 July 2024.
    expect(yearsSecondaryTitle('hijri', 1445, 1445, 'arabic')).toBe(
      '٢٠٢٣ – ٢٠٢٤'
    );
    // 2024 is 19 Jumada al-Akhirah 1445 - 30 Jumada al-Akhirah 1446.
    expect(yearsSecondaryTitle('gregorian', 2024, 2024, 'latin')).toBe(
      '1445 – 1446'
    );
    // 1440-1451 AH is 11 September 2018 - 2 May 2030.
    expect(yearsSecondaryTitle('hijri', 1440, 1451, 'latin')).toBe(
      '2018 – 2030'
    );
    // Only supported days count: 1500-1511 AH is just 1500.
    expect(yearsSecondaryTitle('hijri', 1500, 1511, 'latin')).toBe(
      '2076 – 2077'
    );
    expect(yearsSecondaryTitle('hijri', 1512, 1523, 'latin')).toBe('');
  });

  it('moves the supported years with the Hijri adjustment', () => {
    // With +2 the range is 12 March 1937 - 14 November 2077.
    const range = selectableRange(undefined, undefined, 2);
    expect(enabled(monthsOfYear('gregorian', 2077, range, 2))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(yearOverlaps('hijri', 1356, range, 2)).toBe(true);
    expect(yearOverlaps('hijri', 1501, range, 2)).toBe(false);
  });
});
