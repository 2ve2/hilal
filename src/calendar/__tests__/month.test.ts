import { describe, expect, it } from '@jest/globals';

import { daysFromCivil } from '../../core/days';
import {
  addMonths,
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
